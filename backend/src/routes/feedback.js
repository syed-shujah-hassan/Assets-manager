const express = require('express');

const Feedback = require('../models/Feedback');

const router = express.Router();

function mapFeedback(f) {
  return {
    id: f._id.toString(),
    requestId: f.requestId,
    userId: f.userId,
    userName: f.userName,
    responderId: f.responderId,
    responderName: f.responderName,
    rating: f.rating,
    comment: f.comment,
    date: f.createdAt.toISOString().split('T')[0],
    createdAt: f.createdAt.toISOString(),
  };
}

// GET /api/feedback
router.get('/', async (req, res) => {
  try {
    const docs = await Feedback.find().sort({ createdAt: -1 });
    res.json(docs.map(mapFeedback));
  } catch (err) {
    console.error('Fetch feedback error:', err.message);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
});

// POST /api/feedback
router.post('/', async (req, res) => {
  try {
    const { requestId, userId, userName, responderId, responderName, rating, comment } = req.body;

    if (!requestId || !userId || !userName || !responderId || !responderName || !rating) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const doc = await Feedback.create({
      requestId,
      userId,
      userName,
      responderId,
      responderName,
      rating,
      comment,
    });

    res.status(201).json(mapFeedback(doc));
  } catch (err) {
    console.error('Create feedback error:', err.message);
    res.status(500).json({ message: 'Failed to create feedback' });
  }
});

// DELETE /api/feedback/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Feedback.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    console.error('Delete feedback error:', err.message);
    res.status(500).json({ message: 'Failed to delete feedback' });
  }
});

module.exports = router;
