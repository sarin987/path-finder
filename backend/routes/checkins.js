const express = require('express');
const router = express.Router();
const db = require('../db');
const admin = require('firebase-admin');

// POST /api/checkin/schedule
// Body: { user_id, scheduled_time, location_lat, location_lng }
router.post('/schedule', async (req, res) => {
  const { user_id, scheduled_time, location_lat, location_lng } = req.body;
  try {
    await db.execute(
      'INSERT INTO checkins (user_id, scheduled_time, location_lat, location_lng) VALUES (?, ?, ?, ?)',
      [user_id, scheduled_time, location_lat, location_lng]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to schedule check-in' });
  }
});

// POST /api/checkin/ack
// Body: { checkin_id }
router.post('/ack', async (req, res) => {
  const { checkin_id } = req.body;
  try {
    await db.execute(
      'UPDATE checkins SET acknowledged = TRUE, acknowledged_at = NOW() WHERE id = ?',
      [checkin_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to acknowledge check-in' });
  }
});

// GET /api/checkin/pending/:user_id
router.get('/pending/:user_id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM checkins WHERE user_id = ? AND acknowledged = FALSE AND scheduled_time <= NOW()',
      [req.params.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending check-ins' });
  }
});

module.exports = router;
