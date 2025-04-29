const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Use db connection from config/db.js
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

// GET /api/incidents?recipient=police
router.get('/', async (req, res) => {
  const { recipient } = req.query;
  try {
    let query = 'SELECT * FROM incidents';
    let params = [];
    if (recipient) {
      query += ' WHERE type = ?';
      params.push(recipient);
    }
    query += ' ORDER BY timestamp DESC LIMIT 100';
    const [rows] = await db.execute(query, params);
    res.json({ incidents: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
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
