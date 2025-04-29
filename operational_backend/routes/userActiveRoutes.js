const express = require('express');
const app = express();
const router = express.Router();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const db = require('../config/db'); // Use db connection from config/db.js

// Mark user as active on login
router.post('/login-activity', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing user id' });
  try {
    await db.execute('UPDATE users SET active=1, last_seen=NOW() WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Mark user as inactive on logout
router.post('/logout-activity', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing user id' });
  try {
    await db.execute('UPDATE users SET active=0 WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get all active users (active in last 5 minutes)
router.get('/active', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, name, role, contact, latitude, longitude FROM users WHERE active=1 OR last_seen > (NOW() - INTERVAL 5 MINUTE)');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router;
