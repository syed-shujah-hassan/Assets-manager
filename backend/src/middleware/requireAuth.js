const jwt = require('jsonwebtoken');

function requireAuth(allowedRoles) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) {
        return res.status(401).json({ message: 'Missing auth token' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      if (allowedRoles && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.user = decoded;
      return next();
    } catch {
      return res.status(401).json({ message: 'Invalid auth token' });
    }
  };
}

module.exports = requireAuth;
