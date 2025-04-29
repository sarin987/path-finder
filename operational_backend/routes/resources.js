const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const admin = require('firebase-admin');

// GET /api/resources/availability
router.get('/availability', async (req, res) => {
  try {
    // Ambulance and police vehicles
    const [vehicles] = await db.execute(
      `SELECT ar.*, a.name as agency_name, a.type as agency_type FROM agency_resources ar
       JOIN agencies a ON ar.agency_id = a.id
       WHERE ar.resource_type IN ('ambulance', 'police_vehicle')`
    );
    // Hospital beds
    const [beds] = await db.execute(
      `SELECT * FROM hospital_beds` // You may need to create this table
    );
    res.json({ vehicles, beds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resource availability' });
  }
});

module.exports = router;
