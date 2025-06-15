const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { updateLocation, getRoleLocations } = require('../controllers/locationController');

// @route   POST /api/location/update
// @desc    Update user's location
// @access  Private
router.post('/update', protect, updateLocation);

// @route   GET /api/location/:role
// @desc    Get all live locations for a role
// @access  Public (or protected as needed)
router.get('/:role', getRoleLocations);

module.exports = router;
