const express = require('express');
const bcrypt = require('bcryptjs');

const Responder = require('../models/Responder');
const Request = require('../models/Request');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

/** When `resolvedCount` is passed, it is the live count from the requests collection (source of truth). */
function mapResponder(r, resolvedCount) {
  return {
    id: r._id.toString(),
    name: r.name,
    email: r.email,
    phone: r.phone,
    zone: r.zone || '',
    vehicleType: r.vehicleType || 'Ambulance',
    availability: r.availability || 'Available',
    lastKnownCoordinates: r.lastKnownCoordinates?.lat != null && r.lastKnownCoordinates?.lng != null ? r.lastKnownCoordinates : null,
    lastKnownAccuracy: typeof r.lastKnownAccuracy === 'number' ? r.lastKnownAccuracy : null,
    lastKnownUpdatedAt: r.lastKnownUpdatedAt ? r.lastKnownUpdatedAt.toISOString() : null,
    totalResolved: typeof resolvedCount === 'number' ? resolvedCount : (r.totalResolved ?? 0),
    isActive: r.isActive !== false,
    joinDate: r.joinDate || (r.createdAt ? r.createdAt.toISOString().split('T')[0] : ''),
  };
}

async function countResolvedForResponder(responderId) {
  return Request.countDocuments({
    responderId: String(responderId),
    status: 'Resolved',
  });
}

function toRad(d) {
  return (d * Math.PI) / 180;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function inferIncidentType(description = '') {
  const text = String(description).toLowerCase();
  if (['fire', 'smoke', 'burn', 'blast', 'explosion'].some((w) => text.includes(w))) return 'fire';
  if (['accident', 'crash', 'collision', 'road', 'traffic'].some((w) => text.includes(w))) return 'accident';
  if (['unconscious', 'heart', 'breathing', 'medical', 'bleeding', 'seizure'].some((w) => text.includes(w))) return 'medical';
  return 'general';
}

function getOnlineState(lastKnownUpdatedAt) {
  if (!lastKnownUpdatedAt) return { onlineState: 'Offline', staleSeconds: null };
  const staleSeconds = Math.max(0, Math.floor((Date.now() - new Date(lastKnownUpdatedAt).getTime()) / 1000));
  if (staleSeconds <= 30) return { onlineState: 'Online', staleSeconds };
  if (staleSeconds <= 120) return { onlineState: 'Idle', staleSeconds };
  return { onlineState: 'Offline', staleSeconds };
}

function getVehicleFit(vehicleType, incidentType, recommendedVehicle) {
  const v = String(vehicleType || '').toLowerCase();
  const rec = String(recommendedVehicle || '').toLowerCase();
  if (rec && v.includes(rec.split(' ')[0])) return 4;
  if (incidentType === 'medical' && v.includes('ambulance')) return 3;
  if (incidentType === 'accident' && (v.includes('ambulance') || v.includes('rescue'))) return 3;
  if (incidentType === 'fire' && v.includes('fire')) return 3;
  if (v.includes('ambulance')) return 2;
  return 1;
}

// GET /api/responders
router.get('/', async (req, res) => {
  try {
    const responders = await Responder.find().sort({ createdAt: -1 });
    const ids = responders.map((r) => String(r._id));
    const countByResponderId = {};
    if (ids.length > 0) {
      const aggregated = await Request.aggregate([
        { $match: { status: 'Resolved', responderId: { $in: ids } } },
        { $group: { _id: '$responderId', total: { $sum: 1 } } },
      ]);
      for (const row of aggregated) {
        countByResponderId[String(row._id)] = row.total;
      }
    }
    const mapped = responders.map((r) => mapResponder(r, countByResponderId[String(r._id)] ?? 0));
    res.json(mapped);
  } catch (err) {
    console.error('Fetch responders error:', err.message);
    res.status(500).json({ message: 'Failed to fetch responders' });
  }
});

// GET /api/responders/nearby?lat=..&lng=..&limit=10&maxDistanceKm=30&availability=Available
router.get('/nearby', async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const maxDistanceKm = req.query.maxDistanceKm ? Number(req.query.maxDistanceKm) : null;
    const availability = req.query.availability ? String(req.query.availability) : null;
    const incidentType = req.query.incidentType ? String(req.query.incidentType) : inferIncidentType(req.query.description || '');
    const recommendedVehicle = req.query.recommendedVehicle ? String(req.query.recommendedVehicle) : '';

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'Missing or invalid lat/lng' });
    }

    // Find active responders
    const query = { isActive: true };
    if (availability && availability !== 'All') {
      query.availability = availability;
    }

    const responders = await Responder.find(query);

    let nearby = responders.map(r => {
      let distance = null;
      const onlineMeta = getOnlineState(r.lastKnownUpdatedAt);
      // Only calculate distance if both points exist
      if (r.lastKnownCoordinates?.lat && r.lastKnownCoordinates?.lng && lat && lng) {
        try {
          distance = haversineKm({ lat, lng }, { lat: r.lastKnownCoordinates.lat, lng: r.lastKnownCoordinates.lng });
        } catch (e) {
          console.error('Distance calculation failed for:', r.name);
        }
      }
      return {
        id: r._id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        vehicleType: r.vehicleType || 'Ambulance',
        availability: r.availability,
        lastKnownUpdatedAt: r.lastKnownUpdatedAt ? new Date(r.lastKnownUpdatedAt).toISOString() : null,
        onlineState: onlineMeta.onlineState,
        staleSeconds: onlineMeta.staleSeconds,
        vehicleFitScore: getVehicleFit(r.vehicleType, incidentType, recommendedVehicle),
        lastKnownCoordinates: r.lastKnownCoordinates,
        distance: distance !== null ? Math.round(distance * 10) / 10 : null
      };
    });

    // Sort: Online first, then closest, then vehicle-fit score
    nearby.sort((a, b) => {
      const onlineRank = { Online: 0, Idle: 1, Offline: 2 };
      const aOnline = onlineRank[a.onlineState] ?? 3;
      const bOnline = onlineRank[b.onlineState] ?? 3;
      if (aOnline !== bOnline) return aOnline - bOnline;
      if (a.vehicleFitScore !== b.vehicleFitScore) return b.vehicleFitScore - a.vehicleFitScore;
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    // If maxDistanceKm is provided, only filter those WHO HAVE a distance
    if (maxDistanceKm && maxDistanceKm > 0) {
      nearby = nearby.filter(r => r.distance === null || r.distance <= maxDistanceKm);
    }

    res.json(nearby.slice(0, limit));
  } catch (err) {
    console.error('Fetch nearby responders error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch nearby responders' });
  }
});

// GET /api/responders/:id
router.get('/:id', async (req, res) => {
  try {
    const responder = await Responder.findById(req.params.id);
    if (!responder) {
      return res.status(404).json({ message: 'Responder not found' });
    }
    const totalResolved = await countResolvedForResponder(responder._id);
    res.json(mapResponder(responder, totalResolved));
  } catch (err) {
    console.error('Fetch responder error:', err.message);
    res.status(500).json({ message: 'Failed to fetch responder' });
  }
});

// PATCH /api/responders/:id/location
// Body: { coordinates: { lat, lng }, accuracy?: number, at?: string }
router.patch('/:id/location', async (req, res) => {
  try {
    const { coordinates, accuracy, at } = req.body;
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      return res.status(400).json({ message: 'Missing or invalid coordinates' });
    }

    const updatedAt = at ? new Date(at) : new Date();
    const responder = await Responder.findByIdAndUpdate(
      req.params.id,
      {
        lastKnownCoordinates: { lat: coordinates.lat, lng: coordinates.lng },
        lastKnownAccuracy: typeof accuracy === 'number' ? accuracy : undefined,
        lastKnownUpdatedAt: updatedAt,
      },
      { new: true }
    );

    if (!responder) {
      return res.status(404).json({ message: 'Responder not found' });
    }

    const totalResolved = await countResolvedForResponder(responder._id);
    return res.json(mapResponder(responder, totalResolved));
  } catch (err) {
    console.error('Update responder location error:', err.message);
    return res.status(500).json({ message: 'Failed to update responder location' });
  }
});

// PATCH /api/responders/:id/availability
// Body: { availability: 'Available' | 'Busy' | 'Inactive' }
router.patch('/:id/availability', requireAdmin, async (req, res) => {
  try {
    const { availability } = req.body;
    const allowed = new Set(['Available', 'Busy', 'Inactive']);
    if (!allowed.has(availability)) {
      return res.status(400).json({ message: 'Invalid availability value' });
    }

    const responder = await Responder.findByIdAndUpdate(
      req.params.id,
      { availability },
      { new: true }
    );

    if (!responder) {
      return res.status(404).json({ message: 'Responder not found' });
    }

    const totalResolved = await countResolvedForResponder(responder._id);
    res.json(mapResponder(responder, totalResolved));
  } catch (err) {
    console.error('Update responder availability error:', err.message);
    res.status(500).json({ message: 'Failed to update responder availability' });
  }
});

// POST /api/responders
// Body: { name, email, phone, cnic, password, zone }
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, cnic, password, zone, vehicleType } = req.body;

    if (!name || !email || !phone || !cnic || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingEmail = await Responder.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already registered for a responder' });
    }

    const existingCnic = await Responder.findOne({ cnic });
    if (existingCnic) {
      return res.status(409).json({ message: 'CNIC already registered for a responder' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const responder = await Responder.create({
      name,
      email,
      phone,
      cnic,
      passwordHash,
      zone,
      vehicleType: vehicleType || 'Ambulance',
      availability: 'Available',
      totalResolved: 0,
      joinDate: new Date().toISOString().split('T')[0],
    });

    res.status(201).json(mapResponder(responder, 0));
  } catch (err) {
    console.error('Create responder error:', err.message);
    res.status(500).json({ message: 'Failed to create responder' });
  }
});

// PATCH /api/responders/:id
// Body: { name, email, phone, zone, isActive, availability }
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, zone, isActive, availability, vehicleType } = req.body;
    
    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (phone) update.phone = phone;
    if (zone !== undefined) update.zone = zone;
    if (typeof isActive === 'boolean') update.isActive = isActive;
    if (availability) update.availability = availability;
    if (typeof vehicleType === 'string' && vehicleType.trim()) {
      update.vehicleType = vehicleType.trim();
    }

    const responder = await Responder.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!responder) {
      return res.status(404).json({ message: 'Responder not found' });
    }

    const totalResolved = await countResolvedForResponder(responder._id);
    res.json(mapResponder(responder, totalResolved));
  } catch (err) {
    console.error('Update responder error:', err.message);
    res.status(500).json({ message: 'Failed to update responder' });
  }
});

module.exports = router;
