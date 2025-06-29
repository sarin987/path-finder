const jwt = require('jsonwebtoken');
const models = require('../models/index.js');

// Role to model mapping
const roleToModel = {
  police: models.PoliceUser,
  ambulance: models.AmbulanceUser,
  fire: models.FireUser,
  parent: models.ParentUser,
  user: models.User // Added support for 'user' role
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    try {
      const { id, role } = decoded;
      
      // Get the appropriate model based on role
      const UserModel = roleToModel[role];
      if (!UserModel) {
        return res.status(403).json({ message: 'Invalid user role' });
      }

      // Find user in the appropriate table
      const user = await UserModel.findByPk(id);
      if (!user) {
        return res.status(403).json({ message: 'User not found' });
      }
      
      // Attach user info to request
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        phone: user.phone
      };
      
      next();
    } catch (error) {
      console.error('Error in authentication:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
