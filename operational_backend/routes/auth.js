const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  updateProfile 
} = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register/:role', register); // e.g., /api/auth/register/police
router.post('/login', login);

// Protected routes
router.use(authenticateToken);

// Get current user profile (accessible by all authenticated users)
router.get('/me', getMe);

// Update profile (accessible by all authenticated users)
router.put('/me', updateProfile);

// Example of a protected route that requires specific roles
// router.get('/admin', authorizeRoles('admin'), (req, res) => {
//   res.json({ message: 'Admin access granted' });
// });

module.exports = router;
