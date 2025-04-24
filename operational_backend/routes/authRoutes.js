const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginWithPassword,
  googleSignIn,
  verifyOtp
} = require('../controllers/authController');

// Middleware
router.use(express.json());

// Auth routes
router.post('/register', registerUser);
router.post('/login', loginWithPassword);
router.post('/google', googleSignIn);
router.post('/verify-otp', verifyOtp);

module.exports = router;
