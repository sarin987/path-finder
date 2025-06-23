import express from 'express';
import { authenticate } from '../src/middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({ message: 'User profile' });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
