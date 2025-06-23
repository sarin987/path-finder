const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

// Save FCM token
router.post('/fcm-token', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const result = await NotificationService.saveFCMToken(req.user.id, token);
    res.json(result);
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ success: false, message: 'Failed to save FCM token' });
  }
});

// Send test notification (for testing purposes)
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { title = 'Test Notification', body = 'This is a test notification' } = req.body;
    
    await NotificationService.sendNotification(
      req.user.id,
      title,
      body,
      { type: 'test', url: '/notifications' }
    );
    
    res.json({ success: true, message: 'Test notification sent' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ success: false, message: 'Failed to send test notification' });
  }
});

module.exports = router;
