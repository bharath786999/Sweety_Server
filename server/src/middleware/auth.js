const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

// Sets req.userId from the JWT. Routes never trust a user id from the body.
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in to continue.' });
  try {
    req.userId = jwt.verify(token, jwtSecret).id;
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
};
