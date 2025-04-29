const express = require('express');
const router = express.Router();
const db = require('../db');
const admin = require('firebase-admin');

// GET /api/agencies/all
router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM agencies');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch agencies' });
  }
});

// GET /api/agencies/resources
router.get('/resources', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT ar.*, a.name as agency_name, a.type as agency_type FROM agency_resources ar
       JOIN agencies a ON ar.agency_id = a.id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// GET /api/agencies/incidents
router.get('/incidents', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT ai.*, i.*, a.name as agency_name FROM agency_incidents ai
       JOIN incidents i ON ai.incident_id = i.id
       JOIN agencies a ON ai.agency_id = a.id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch agency incidents' });
  }
});

module.exports = router;
