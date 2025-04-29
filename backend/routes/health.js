const express = require('express');
const router = express.Router();
const db = require('../db');
const admin = require('firebase-admin');

// POST /api/health/event
// Body: { user_id, heart_rate, fall_detected }
router.post('/event', async (req, res) => {
  const { user_id, heart_rate, fall_detected } = req.body;
  let alert_sent = false;
  try {
    // Trigger alert if vitals are abnormal or fall detected
    if ((heart_rate && (heart_rate < 40 || heart_rate > 180)) || fall_detected) {
      alert_sent = true;
      // Push to Firebase for real-time alert
      await admin.database().ref('health_alerts').push({
        user_id, heart_rate, fall_detected, timestamp: Date.now()
      });
      // Optionally: send alert to trusted contacts as well
    }
    await db.execute(
      'INSERT INTO health_events (user_id, heart_rate, fall_detected, alert_sent) VALUES (?, ?, ?, ?)',
      [user_id, heart_rate, fall_detected, alert_sent]
    );
    res.status(201).json({ alert_sent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log health event' });
  }
});

// GET /api/health/history/:user_id
router.get('/history/:user_id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM health_events WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100',
      [req.params.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch health history' });
  }
});

module.exports = router;
