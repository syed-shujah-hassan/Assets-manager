const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (!token) {
      return res.status(401).json({ message: 'Missing auth token' });
    }
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

module.exports = requireAdmin;
