const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const authenticateToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Verify token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken
};
