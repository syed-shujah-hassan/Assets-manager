const express = require('express');

const Request = require('../models/Request');
const Responder = require('../models/Responder');
const Feedback = require('../models/Feedback');
const Citizen = require('../models/Citizen');
const User = require('../models/User');

const router = express.Router();

// GET /api/reports
router.get('/', async (req, res) => {
  try {
    const totalRequests = await Request.countDocuments();
    const activeRequests = await Request.countDocuments({
      status: { $in: ['Pending', 'Assigned', 'En Route', 'Arrived'] }
    });
    const resolvedRequests = await Request.countDocuments({ status: 'Resolved' });
    const cancelledRequests = await Request.countDocuments({ status: 'Cancelled' });
    const totalResponders = await Responder.countDocuments();
    const activeResponders = await Responder.countDocuments({ availability: 'Available' });
    const [citizenCount, legacyUserCount] = await Promise.all([
      Citizen.countDocuments(),
      User.countDocuments({ role: { $in: ['citizen', null] } }),
    ]);
    const totalUsers = citizenCount + legacyUserCount;
    const totalFeedback = await Feedback.countDocuments();

    // Calculate average rating
    const feedbackDocs = await Feedback.find();
    const avgRating = feedbackDocs.length > 0 
      ? (feedbackDocs.reduce((sum, f) => sum + f.rating, 0) / feedbackDocs.length).toFixed(1)
      : '0.0';

    // Calculate average response time (simulated - in real app would track actual response times)
    const avgResponseTime = '8.5 min';

    // Calculate resolution rate
    const resolutionRate = totalRequests > 0 
      ? Math.round((resolvedRequests / totalRequests) * 100)
      : 0;

    // Get requests by status breakdown
    const requestsByStatus = await Request.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Get requests by priority (if priority field exists)
    const requestsByPriority = await Request.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Get feedback distribution
    const feedbackDistribution = await Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalRequests,
      activeRequests,
      resolvedRequests,
      cancelledRequests,
      totalResponders,
      activeResponders,
      totalUsers,
      totalFeedback,
      avgRating,
      avgResponseTime,
      resolutionRate,
      requestsByStatus,
      requestsByPriority,
      feedbackDistribution,
    });
  } catch (err) {
    console.error('Fetch reports error:', err.message);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

module.exports = router;
