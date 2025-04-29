const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Use db connection from config/db.js

// Get latest fire incidents
router.get('/incidents', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM fire_incidents ORDER BY reported_at DESC LIMIT 20');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get latest fire resource status
router.get('/resources', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM fire_resources ORDER BY updated_at DESC LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Add new fire incident
router.post('/incidents', async (req, res) => {
  const { location, status, reported_at, type } = req.body;
  if (!location || !status || !reported_at || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await db.execute('INSERT INTO fire_incidents (location, status, reported_at, type) VALUES (?, ?, ?, ?)', [location, status, reported_at, type]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Update fire resources
router.post('/resources', async (req, res) => {
  const { trucks, personnel, hoses } = req.body;
  if (trucks == null || personnel == null || hoses == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await db.execute('INSERT INTO fire_resources (trucks, personnel, hoses, updated_at) VALUES (?, ?, ?, NOW())', [trucks, personnel, hoses]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router;
