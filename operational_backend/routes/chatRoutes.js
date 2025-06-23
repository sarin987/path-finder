import express from 'express';
import { authenticate } from '../src/middleware/auth.js';

const router = express.Router();

// Get all chat messages for a room
router.get('/:roomId', authenticate, async (req, res) => {
  try {
    res.json({ message: 'Chat messages endpoint' });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a new message
router.post('/:roomId/messages', authenticate, async (req, res) => {
  try {
    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
