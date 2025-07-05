const express = require('express');
const { loginUser } = require('../controllers/userAuthController');

const router = express.Router();

// User authentication routes
router.post('/login', loginUser);

module.exports = router;
