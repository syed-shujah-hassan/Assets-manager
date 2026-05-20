const express = require('express');

const Request = require('../models/Request');
const Responder = require('../models/Responder');
const {
  allocateReferenceCode,
  displayReference,
  normalizeIncomingReference,
  isMongoObjectIdString,
} = require('../utils/requestReference');

const router = express.Router();

function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (!token) {
      return res.status(401).json({ message: 'Missing auth token' });
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    if (decoded?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid auth token' });
  }
}

function mapRequest(doc) {
  return {
    id: doc._id.toString(),
    referenceCode: displayReference(doc),
    userId: doc.userId || 'U1',
    userName: doc.userName || 'Citizen',
    userPhone: doc.userPhone,
    description: doc.description,
    location: doc.location,
    coordinates: doc.coordinates,
    photoUri: doc.photoUrl,
    status: doc.status,
    responderId: doc.responderId,
    responderName: doc.responderName,
    responderPhone: doc.responderPhone,
    distance: doc.distance,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

async function findRequestDocument(param) {
  const raw = String(param || '').trim();
  if (!raw) return null;
  if (isMongoObjectIdString(raw)) return Request.findById(raw);
  const ref = normalizeIncomingReference(raw);
  if (!ref) return null;
  return Request.findOne({ referenceCode: ref });
}

// GET /api/requests
router.get('/', async (req, res) => {
  try {
    const docs = await Request.find().sort({ createdAt: -1 });
    res.json(docs.map(mapRequest));
  } catch (err) {
    console.error('Fetch requests error:', err.message);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// PATCH /api/requests/:id/assign
// Internal/Admin use. Body: { responderId }
router.patch('/:id/assign', async (req, res) => {
  try {
    const { responderId } = req.body;
    if (!responderId) {
      return res.status(400).json({ message: 'responderId is required' });
    }

    const responder = await Responder.findById(responderId);
    if (!responder) {
      return res.status(404).json({ message: 'Responder not found' });
    }

    const existing = await findRequestDocument(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (
      existing?.responderId &&
      String(existing.responderId) !== String(responder._id)
    ) {
      await Responder.findByIdAndUpdate(existing.responderId, { availability: 'Available' });
    }

    const doc = await Request.findByIdAndUpdate(
      existing._id,
      {
        responderId: responder._id.toString(),
        responderName: responder.name,
        responderPhone: responder.phone,
        status: 'Assigned',
      },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    return res.json(mapRequest(doc));
  } catch (err) {
    console.error('Assign request error:', err.message);
    return res.status(500).json({ message: 'Failed to assign request' });
  }
});

// GET /api/requests/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await findRequestDocument(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    return res.json(mapRequest(doc));
  } catch (err) {
    console.error('Fetch request error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch request' });
  }
});

// PATCH /api/requests/:id/status
// Body: { status }
router.patch('/:id/status', async (req, res) => {
  try {
    const target = await findRequestDocument(req.params.id);
    if (!target) return res.status(404).json({ message: 'Request not found' });

    const { status } = req.body;
    const allowed = new Set(['Pending', 'Assigned', 'En Route', 'Arrived', 'Resolved', 'Cancelled']);
    if (!allowed.has(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // If resolving/cancelling, free the assigned responder (best-effort)
    if (status === 'Resolved' || status === 'Cancelled') {
      if (target.responderId) {
        await Responder.findByIdAndUpdate(target.responderId, { availability: 'Available' });
      }
    }

    const doc = await Request.findByIdAndUpdate(target._id, { status }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Request not found' });

    // Busy only after responder accepts (starts navigation)
    if (status === 'En Route' && doc.responderId) {
      await Responder.findByIdAndUpdate(doc.responderId, { availability: 'Busy' });
    }

    return res.json(mapRequest(doc));
  } catch (err) {
    console.error('Update request status error:', err.message);
    return res.status(500).json({ message: 'Failed to update status' });
  }
});

// POST /api/requests
router.post('/', async (req, res) => {
  try {
    const { description, location, coordinates, photoUrl, userId, userName, userPhone } = req.body;

    if (!description || !location || !coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      return res.status(400).json({ message: 'Missing or invalid fields' });
    }

    const referenceCode = await allocateReferenceCode(Request);
    const doc = await Request.create({
      description,
      location,
      coordinates,
      photoUrl,
      userId,
      userName,
      userPhone,
      referenceCode,
    });

    res.status(201).json(mapRequest(doc));
  } catch (err) {
    console.error('Create request error:', err.message);
    res.status(500).json({ message: 'Failed to create request' });
  }
});

// PATCH /api/requests/:id/citizen-location
// Body: { coordinates: { lat, lng }, accuracy?: number, at?: string }
router.patch('/:id/citizen-location', async (req, res) => {
  try {
    const { coordinates, accuracy, at } = req.body;
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      return res.status(400).json({ message: 'Missing or invalid coordinates' });
    }

    const updatedAt = at ? new Date(at) : new Date();
    const target = await findRequestDocument(req.params.id);
    if (!target) return res.status(404).json({ message: 'Request not found' });
    const doc = await Request.findByIdAndUpdate(
      target._id,
      {
        citizenLiveCoordinates: { lat: coordinates.lat, lng: coordinates.lng },
        citizenLiveAccuracy: typeof accuracy === 'number' ? accuracy : undefined,
        citizenLiveUpdatedAt: updatedAt,
      },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: 'Request not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Update citizen location error:', err.message);
    return res.status(500).json({ message: 'Failed to update citizen location' });
  }
});

// PATCH /api/requests/:id/responder-location
// Body: { responderId?: string, coordinates: { lat, lng }, accuracy?: number, at?: string }
router.patch('/:id/responder-location', async (req, res) => {
  try {
    const { coordinates, accuracy, at, responderId } = req.body;
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      return res.status(400).json({ message: 'Missing or invalid coordinates' });
    }

    const updatedAt = at ? new Date(at) : new Date();
    const update = {
      responderLiveCoordinates: { lat: coordinates.lat, lng: coordinates.lng },
      responderLiveAccuracy: typeof accuracy === 'number' ? accuracy : undefined,
      responderLiveUpdatedAt: updatedAt,
    };
    if (responderId) {
      update.responderId = responderId;
    }

    const target = await findRequestDocument(req.params.id);
    if (!target) return res.status(404).json({ message: 'Request not found' });
    const doc = await Request.findByIdAndUpdate(target._id, update, { new: true });
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Update responder location error:', err.message);
    return res.status(500).json({ message: 'Failed to update responder location' });
  }
});

// GET /api/requests/:id/locations
// Returns incident coordinates + latest citizen/responder live coordinates
router.get('/:id/locations', async (req, res) => {
  try {
    const doc = await findRequestDocument(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });

    return res.json({
      requestId: doc._id.toString(),
      referenceCode: displayReference(doc),
      incident: {
        location: doc.location,
        coordinates: doc.coordinates,
        capturedAt: doc.createdAt ? doc.createdAt.toISOString() : null,
      },
      citizenLive: doc.citizenLiveCoordinates?.lat != null && doc.citizenLiveCoordinates?.lng != null ? {
        coordinates: doc.citizenLiveCoordinates,
        accuracy: doc.citizenLiveAccuracy ?? null,
        updatedAt: doc.citizenLiveUpdatedAt ? doc.citizenLiveUpdatedAt.toISOString() : null,
      } : null,
      responderLive: doc.responderLiveCoordinates?.lat != null && doc.responderLiveCoordinates?.lng != null ? {
        coordinates: doc.responderLiveCoordinates,
        accuracy: doc.responderLiveAccuracy ?? null,
        updatedAt: doc.responderLiveUpdatedAt ? doc.responderLiveUpdatedAt.toISOString() : null,
      } : null,
    });
  } catch (err) {
    console.error('Fetch locations error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch locations' });
  }
});

// GET /api/requests/responder/:responderId/history
router.get('/responder/:responderId/history', async (req, res) => {
  try {
    const { responderId } = req.params;
    // Fetch all requests for this responder that are finished
    const docs = await Request.find({ 
      responderId, 
      status: { $in: ['Resolved', 'Cancelled'] } 
    }).sort({ updatedAt: -1 });
    
    res.json(docs.map(mapRequest));
  } catch (err) {
    console.error('Fetch responder history error:', err.message);
    res.status(500).json({ message: 'Failed to fetch responder history' });
  }
});

module.exports = router;
