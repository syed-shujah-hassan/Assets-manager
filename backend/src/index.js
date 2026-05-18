require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDb = require('./config/db');
const authRoutes = require('./routes/auth');
const responderRoutes = require('./routes/responders');
const requestRoutes = require('./routes/requests');
const userRoutes = require('./routes/users');
const feedbackRoutes = require('./routes/feedback');
const logsRoutes = require('./routes/logs');
const reportsRoutes = require('./routes/reports');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'rms-backend' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/responders', responderRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/reports', reportsRoutes);

// Start server after DB connection
const PORT = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`RMS backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to DB error:', err.message);
    process.exit(1);
  });
