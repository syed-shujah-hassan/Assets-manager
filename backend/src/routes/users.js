const express = require('express');

const Citizen = require('../models/Citizen');
const User = require('../models/User');
const Request = require('../models/Request');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

function mapCitizen(c, totalRequests) {
  return {
    id: c._id.toString(),
    name: c.name,
    email: c.email,
    phone: c.phone,
    cnic: c.cnic,
    isActive: c.isActive !== false,
    lastLoginAt: c.lastLoginAt ? c.lastLoginAt.toISOString() : null,
    totalRequests: totalRequests ?? 0,
  };
}

// GET /api/users
// Returns all registered citizens (app signups)
router.get('/', async (req, res) => {
  try {
    const [citizens, legacyUsers] = await Promise.all([
      Citizen.find().sort({ createdAt: -1 }),
      User.find({ role: { $in: ['citizen', null] } }).sort({ createdAt: -1 }),
    ]);

    const seen = new Set();
    const allUsers = [];

    for (const c of citizens) {
      const key = (c.email || c.cnic || c._id.toString()).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      allUsers.push(c);
    }

    for (const u of legacyUsers) {
      const key = (u.email || u.cnic || u._id.toString()).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      allUsers.push(u);
    }

    const userIds = allUsers.map((c) => c._id.toString());

    const counts = await Request.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);

    const countsMap = new Map(counts.map((x) => [x._id, x.count]));

    const mapped = allUsers.map((c) => mapCitizen(c, countsMap.get(c._id.toString())));
    res.json(mapped);
  } catch (err) {
    console.error('Fetch users error:', err.message);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// PATCH /api/users/:id/status
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const doc = await Citizen.findByIdAndUpdate(
      req.params.id,
      { isActive: isActive !== false },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'User not found' });
    res.json(mapCitizen(doc, 0));
  } catch (err) {
    console.error('Update user status error:', err.message);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const doc = await Citizen.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
