const express = require('express');
const { 
  register, 
  login,
  userLogin,
  adminLogin,
  responderLogin,
  getMe, 
  updateProfile 
} = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register/:role', register); // e.g., /api/auth/register/police

// Login endpoints
router.post('/login', login); // Original login (kept for backward compatibility)
router.post('/login/user', userLogin); // User login
router.post('/login/admin', adminLogin); // Admin login
router.post('/login/responder', responderLogin); // Responder login (police, ambulance, fire)

// Protected routes
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateProfile);

module.exports = router;
