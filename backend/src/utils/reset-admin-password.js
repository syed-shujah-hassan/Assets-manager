require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function run() {
  const email = (process.argv[2] || 'admin@rms.gov.pk').toLowerCase().trim();
  const newPassword = process.argv[3];

  if (!newPassword || newPassword.length < 6) {
    console.error('Usage: node src/utils/reset-admin-password.js [email] <new-password>');
    console.error('Example: node src/utils/reset-admin-password.js admin@rms.gov.pk Admin123');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.error(`No admin found with email: ${email}`);
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    admin.passwordHash = await bcrypt.hash(newPassword, salt);
    await admin.save();

    console.log('Admin password updated successfully.');
    console.log('Email:   ', admin.email);
    console.log('Password:', newPassword);
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();
