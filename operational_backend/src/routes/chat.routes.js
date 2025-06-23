const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller').init();
const { authenticateToken } = require('../middleware/auth');

// Get chat history between two users
router.get('/history/:userId1/:userId2', authenticateToken, (req, res) => chatController.getChatHistory(req, res));

// Mark messages as read
router.post('/mark-read', authenticateToken, (req, res) => chatController.markAsRead(req, res));

// Get unread message count
router.get('/unread-count', authenticateToken, (req, res) => chatController.getUnreadCount(req, res));

// Get messages for a specific room
router.get('/messages/room/:roomId', authenticateToken, (req, res) => chatController.getRoomMessages(req, res));

// Get user's recent conversations
router.get('/conversations', authenticateToken, (req, res) => chatController.getRecentConversations(req, res));

// Add or update a reaction to a message
router.post('/messages/:messageId/reaction', authenticateToken, (req, res) => chatController.addReaction(req, res));

// Edit a message
router.put('/messages/:messageId', authenticateToken, (req, res) => chatController.editMessage(req, res));

// Delete a message
router.delete('/messages/:messageId', authenticateToken, (req, res) => chatController.deleteMessage(req, res));

// Search messages
router.get('/search', authenticateToken, (req, res) => chatController.searchMessages(req, res));

module.exports = router;
