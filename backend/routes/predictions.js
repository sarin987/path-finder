const express = require('express');
const router = express.Router();
const db = require('../db');
const admin = require('firebase-admin');

// GET /api/predictions/risks?lat=...&lng=...
router.get('/risks', async (req, res) => {
  const { lat, lng } = req.query;
  try {
    // Find nearby risks within a certain radius (e.g. 5km)
    const [rows] = await db.execute(
      `SELECT *, (
        6371 * acos(
          cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) +
          sin(radians(?)) * sin(radians(lat))
        )
      ) AS distance
      FROM risk_predictions
      HAVING distance < 5
      ORDER BY risk_level DESC, distance ASC
      LIMIT 10`,
      [lat, lng, lat]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch risk predictions' });
  }
});

// POST /api/predictions/add (admin/ML job)
router.post('/add', async (req, res) => {
  const { risk_type, lat, lng, risk_level, description } = req.body;
  try {
    await db.execute(
      'INSERT INTO risk_predictions (risk_type, lat, lng, risk_level, description) VALUES (?, ?, ?, ?, ?)',
      [risk_type, lat, lng, risk_level, description]
    );
    // Push to Firebase for live updates if needed
    await admin.database().ref('risk_predictions').push({
      risk_type, lat, lng, risk_level, description, prediction_time: Date.now()
    });
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add risk prediction' });
  }
});

module.exports = router;
