const express = require('express');
const router = express.Router();
const multer = require('multer');
const ChatController = require('../controllers/chatController');
const { authenticateToken: authMiddleware } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, audio, and documents
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Send a message
router.post('/messages', upload.single('file'), ChatController.sendMessage);

// Get conversation messages
router.get('/conversations/:conversationId/messages', ChatController.getMessages);

// Mark messages as read
router.post('/messages/read', ChatController.markAsRead);

// Get user conversations
router.get('/conversations', ChatController.getConversations);

// Error handling middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      details: err.message
    });
  } else if (err) {
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: err.message
    });
  }
  next();
});

module.exports = router;
