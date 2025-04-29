const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const admin = require('firebase-admin');

// POST /api/call/initiate
// Body: { user_id, call_type, location_lat, location_lng }
router.post('/initiate', async (req, res) => {
  const { user_id, call_type, location_lat, location_lng } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO calls (user_id, call_type, location_lat, location_lng) VALUES (?, ?, ?, ?)',
      [user_id, call_type, location_lat, location_lng]
    );
    // Optionally: Push to Firebase for real-time call signaling
    await admin.database().ref('calls').push({
      call_id: result.insertId,
      user_id,
      call_type,
      location_lat,
      location_lng,
      started_at: Date.now(),
      status: 'active'
    });
    res.status(201).json({ call_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

// POST /api/call/end
// Body: { call_id }
router.post('/end', async (req, res) => {
  const { call_id } = req.body;
  try {
    await db.execute(
      'UPDATE calls SET status = "ended", ended_at = NOW() WHERE id = ?',
      [call_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end call' });
  }
});

module.exports = router;
