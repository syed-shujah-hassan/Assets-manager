const express = require('express');

const Log = require('../models/Log');

const router = express.Router();

function mapLog(l) {
  return {
    id: l._id.toString(),
    timestamp: l.createdAt.toISOString().replace('T', ' ').substring(0, 19),
    action: l.action,
    details: l.details,
    userId: l.userId,
    userName: l.userName,
    requestId: l.requestId,
    responderId: l.responderId,
    entityType: l.entityType,
  };
}

// GET /api/logs
router.get('/', async (req, res) => {
  try {
    const { action, entityType, limit = 100 } = req.query;

    let query = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    const docs = await Log.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(docs.map(mapLog));
  } catch (err) {
    console.error('Fetch logs error:', err.message);
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

// POST /api/logs
router.post('/', async (req, res) => {
  try {
    const { action, details, userId, userName, requestId, responderId, entityType } = req.body;

    if (!action || !details) {
      return res.status(400).json({ message: 'action and details are required' });
    }

    const doc = await Log.create({
      action,
      details,
      userId,
      userName,
      requestId,
      responderId,
      entityType,
    });

    res.status(201).json(mapLog(doc));
  } catch (err) {
    console.error('Create log error:', err.message);
    res.status(500).json({ message: 'Failed to create log' });
  }
});

module.exports = router;
