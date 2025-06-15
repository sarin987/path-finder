import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  updateProfile 
} from '../controllers/authController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

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

export default router;
