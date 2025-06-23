const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { validateRequest } = require('../middleware/validateRequest');
const { authenticateToken: auth } = require('../middleware/auth');
const LocationService = require('../services/locationService');

/**
 * @route   GET /api/locations/responders
 * @desc    Get all active responders' locations
 * @access  Private
 */
router.get('/responders', auth, async (req, res) => {
  try {
    const { role } = req.query;
    const responders = await LocationService.getActiveResponders(role);
    res.json(responders);
  } catch (error) {
    console.error('Error getting responders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/locations/update
 * @desc    Update current user's location
 * @access  Private (Responders only)
 */
router.post(
  '/update',
  [
    auth,
    check('lat', 'Latitude is required').isFloat(),
    check('lng', 'Longitude is required').isFloat(),
    validateRequest,
  ],
  async (req, res) => {
    try {
      const { lat, lng, status = 'available' } = req.body;
      const userId = req.user.id;
      const role = req.user.role;

      // Only allow responders to update their location
      if (role !== 'responder') {
        return res.status(403).json({ message: 'Only responders can update location' });
      }

      const location = await LocationService.updateResponderLocation(
        userId,
        role,
        lat,
        lng,
        status
      );

      res.json(location);
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * @route   POST /api/locations/offline
 * @desc    Mark responder as offline
 * @access  Private (Responders only)
 */
router.post('/offline', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    // Only allow responders to update their status
    if (role !== 'responder') {
      return res.status(403).json({ message: 'Only responders can update status' });
    }

    await LocationService.markResponderOffline(userId);
    res.json({ message: 'Marked as offline' });
  } catch (error) {
    console.error('Error marking as offline:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
