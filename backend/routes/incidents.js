const express = require('express');
const router = express.Router();
const db = require('../db'); // MySQL connection
const admin = require('firebase-admin'); // Firebase Admin SDK

// POST /api/incidents/report
router.post('/report', async (req, res) => {
  const { user_id, type, description, photo_url, lat, lng } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO incidents (user_id, type, description, photo_url, lat, lng) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, type, description, photo_url, lat, lng]
    );
    // Push to Firebase
    await admin.database().ref('incidents').push({
      id: result.insertId,
      user_id, type, description, photo_url, lat, lng, timestamp: Date.now()
    });
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to report incident' });
  }
});

// GET /api/incidents/all
router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM incidents ORDER BY timestamp DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

module.exports = router;
