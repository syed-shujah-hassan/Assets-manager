const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Citizen = require('../models/Citizen');
const Responder = require('../models/Responder');
const Admin = require('../models/Admin');

const router = express.Router();
const requireAuth = require('../middleware/requireAuth');

function mapUser(doc, role) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    cnic: doc.cnic,
    role,
  };
}

function getModelByRole(role) {
  if (role === 'responder') return Responder;
  if (role === 'admin') return Admin;
  return Citizen; // default citizen
}

// POST /api/auth/register
// Frontend citizen register form: name, email, password, phone, cnic
// You can also create responder/admin by passing role explicitly
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, cnic, password, role } = req.body;

    if (!name || !email || !phone || !cnic || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const normalizedRole = role === 'responder' || role === 'admin' ? role : 'citizen';
    const Model = getModelByRole(normalizedRole);

    // Ensure email / CNIC are unique across all collections
    const existingEmail =
      (await Citizen.findOne({ email })) ||
      (await Responder.findOne({ email })) ||
      (await Admin.findOne({ email }));
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const existingCnic =
      (await Citizen.findOne({ cnic })) ||
      (await Responder.findOne({ cnic })) ||
      (await Admin.findOne({ cnic }));
    if (existingCnic) {
      return res.status(409).json({ message: 'CNIC already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await Model.create({
      name,
      email,
      phone,
      cnic,
      passwordHash,
    });

    const token = jwt.sign(
      { id: user._id, role: normalizedRole },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cnic: user.cnic,
        role: normalizedRole,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
// Matches frontend idea: loginUser(identifier, password, role)
// - citizen: identifier = CNIC (login by CNIC)
// - responder/admin: identifier = email (login by email)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, role, cnic, email } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const normalizedRole = role === 'responder' || role === 'admin' ? role : 'citizen';
    const Model = getModelByRole(normalizedRole);

    let user = null;

    // Preferred: explicit identifier + role from frontend
    if (identifier && normalizedRole === 'citizen') {
      user = await Model.findOne({ cnic: identifier });
    } else if (identifier && (normalizedRole === 'responder' || normalizedRole === 'admin')) {
      user = await Model.findOne({ email: identifier });
    } else if (cnic) {
      // Backwards compatibility: { cnic, password }
      user = await Citizen.findOne({ cnic });
    } else if (email) {
      // Backwards compatibility: { email, password }
      // Try responders then admins
      user = (await Responder.findOne({ email })) || (await Admin.findOne({ email }));
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Track last login for citizens (for admin dashboard users list)
    if (normalizedRole === 'citizen') {
      try {
        user.lastLoginAt = new Date();
        await user.save();
      } catch {
        // ignore
      }
    }

    const token = jwt.sign(
      { id: user._id, role: normalizedRole },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cnic: user.cnic,
        role: normalizedRole,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth(['citizen', 'responder']), async (req, res) => {
  try {
    const Model = getModelByRole(req.user.role);
    const doc = await Model.findById(req.user.id);
    if (!doc) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: mapUser(doc, req.user.role) });
  } catch (err) {
    console.error('Auth me error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/auth/profile
router.patch('/profile', requireAuth(['citizen', 'responder']), async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const Model = getModelByRole(req.user.role);
    const doc = await Model.findById(req.user.id);
    if (!doc) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return res.status(400).json({ message: 'Name is required' });
      doc.name = trimmed;
    }
    if (phone !== undefined) {
      const trimmed = String(phone).trim();
      if (!trimmed) return res.status(400).json({ message: 'Phone is required' });
      doc.phone = trimmed;
    }
    if (email !== undefined) {
      const trimmed = String(email).trim().toLowerCase();
      if (!trimmed) return res.status(400).json({ message: 'Email is required' });
      const existing =
        (await Citizen.findOne({ email: trimmed, _id: { $ne: doc._id } })) ||
        (await Responder.findOne({ email: trimmed, _id: { $ne: doc._id } })) ||
        (await Admin.findOne({ email: trimmed }));
      if (existing) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      doc.email = trimmed;
    }

    await doc.save();
    res.json({ user: mapUser(doc, req.user.role) });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// PATCH /api/auth/password
router.patch('/password', requireAuth(['citizen', 'responder']), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const Model = getModelByRole(req.user.role);
    const doc = await Model.findById(req.user.id);
    if (!doc) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, doc.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    doc.passwordHash = await bcrypt.hash(newPassword, salt);
    await doc.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

module.exports = router;
