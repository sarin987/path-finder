const express = require('express');
const router = express.Router();
const SafetyRating = require('../models/SafetyRating');
const { Op } = require('sequelize');

// POST /api/ratings - submit a new rating
router.post('/', async (req, res) => {
  try {
    const { userId, lat, lng, placeName, rating, comment, timestamp } = req.body;
    if (!userId || !lat || !lng || !placeName || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const newRating = await SafetyRating.create({ userId, lat, lng, placeName, rating, comment, timestamp });
    res.status(201).json(newRating);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ratings/nearby?lat=...&lng=...&radius=0.01
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 0.01 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  try {
    const ratings = await SafetyRating.findAll({
      where: {
        lat: { [Op.between]: [parseFloat(lat) - parseFloat(radius), parseFloat(lat) + parseFloat(radius)] },
        lng: { [Op.between]: [parseFloat(lng) - parseFloat(radius), parseFloat(lng) + parseFloat(radius)] },
      },
    });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ratings/average?lat=...&lng=...&radius=0.005
router.get('/average', async (req, res) => {
  const { lat, lng, radius = 0.005 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  try {
    const ratings = await SafetyRating.findAll({
      where: {
        lat: { [Op.between]: [parseFloat(lat) - parseFloat(radius), parseFloat(lat) + parseFloat(radius)] },
        lng: { [Op.between]: [parseFloat(lng) - parseFloat(radius), parseFloat(lng) + parseFloat(radius)] },
      },
    });
    if (!ratings.length) return res.json({ avg: null });
    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    res.json({ avg, count: ratings.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
