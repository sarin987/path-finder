const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const db = require('../config/db');
const bcrypt = require('bcrypt');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `profile-${uniqueSuffix}.${file.originalname.split('.').pop()}`)
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [rows] = await db.query(
      'SELECT id, name, phone, role, email, profile_photo, gender, user_verified FROM users WHERE id = ?',
      [userId]
    );

    // Check if user exists
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      profile: rows[0]
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update profile photo
router.post('/profile-photo', auth, upload.single('profile_photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    await db.query(
      'UPDATE users SET profile_photo = ? WHERE id = ?',
      [req.file.filename, req.user.userId]
    );

    res.json({
      success: true,
      profile_photo: req.file.filename
    });
  } catch (error) {
    console.error('Profile photo update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile photo'
    });
  }
});

// Update password
router.put('/update-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const [users] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const validPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password'
    });
  }
});

// Update email
router.put('/update-email', auth, async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is already in use
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, req.user.userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    await db.query(
      'UPDATE users SET email = ? WHERE id = ?',
      [email, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Email updated successfully'
    });
  } catch (error) {
    console.error('Email update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email'
    });
  }
});

module.exports = router;