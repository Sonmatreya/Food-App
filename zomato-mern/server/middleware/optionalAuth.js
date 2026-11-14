const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Attaches req.user when a valid token is sent, but never blocks the request.
module.exports = async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      const { id } = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      req.user = await User.findById(id).select('-password');
    }
  } catch {
    /* treat as guest */
  }
  next();
};
