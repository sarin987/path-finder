// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const messageController = require('../controllers/messageController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Message routes
router.post('/send', messageController.sendMessage);
router.post('/upload-image', upload.single('image'), messageController.uploadImage);
router.get('/service/:serviceType/user/:userId', messageController.getMessages);

module.exports = router;