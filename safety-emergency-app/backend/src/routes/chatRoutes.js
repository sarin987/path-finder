const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Get messages for a specific room
router.get('/messages/room/:roomId', authenticateToken, chatController.getRoomMessages);

// Get user's recent conversations
router.get('/conversations', authenticateToken, chatController.getRecentConversations);

// Mark messages as read
router.post('/messages/read', authenticateToken, chatController.markAsRead);

// Add or update a reaction to a message
router.post('/messages/:messageId/reaction', authenticateToken, chatController.addReaction);

// Edit a message
router.put('/messages/:messageId', authenticateToken, chatController.editMessage);

// Delete a message
router.delete('/messages/:messageId', authenticateToken, chatController.deleteMessage);

// Search messages
router.get('/search', authenticateToken, chatController.searchMessages);

// Get unread message count
router.get('/unread-count', authenticateToken, chatController.getUnreadCount);

module.exports = router;
