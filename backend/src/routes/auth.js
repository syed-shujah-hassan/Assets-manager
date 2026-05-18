const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Citizen = require('../models/Citizen');
const Responder = require('../models/Responder');
const Admin = require('../models/Admin');

const router = express.Router();

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

module.exports = router;
