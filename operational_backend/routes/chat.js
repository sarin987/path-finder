// Chat Routes
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/history', chatController.getChatHistory);
router.post('/send', chatController.sendMessage);
router.post('/read', chatController.markAsRead);

module.exports = router;
