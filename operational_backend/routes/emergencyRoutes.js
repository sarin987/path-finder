import express from 'express';
import { authenticate } from '../src/middleware/auth.js';

const router = express.Router();

// Create a new emergency
router.post('/', authenticate, async (req, res) => {
  try {
    res.json({ message: 'Emergency created successfully' });
  } catch (error) {
    console.error('Error creating emergency:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all emergencies
router.get('/', authenticate, async (req, res) => {
  try {
    res.json({ message: 'List of emergencies' });
  } catch (error) {
    console.error('Error fetching emergencies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
