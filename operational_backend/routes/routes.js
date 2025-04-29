const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../utils/database');
const admin = require('firebase-admin');

// Helper: Check for risks/incidents along the route
async function getRisksOnRoute(routePoints) {
  // For each point, check for risks/incidents within 0.5km
  const risks = [];
  for (const pt of routePoints) {
    const [rows] = await db.execute(
      `SELECT * FROM risk_predictions WHERE
        (6371 * acos(
          cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) +
          sin(radians(?)) * sin(radians(lat))
        )) < 0.5
        ORDER BY risk_level DESC`,
      [pt.lat, pt.lng, pt.lat]
    );
    if (rows.length > 0) risks.push(...rows);
  }
  return risks;
}

// POST /api/routes/safe
// Body: { start: {lat, lng}, end: {lat, lng} }
router.post('/safe', async (req, res) => {
  const { start, end } = req.body;
  try {
    // Call Google Directions API for route
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&key=${apiKey}`;
    const dirRes = await axios.get(url);
    const route = dirRes.data.routes[0];
    // Extract route points (simplified: only legs/steps start locations)
    const routePoints = route.legs[0].steps.map(step => ({
      lat: step.start_location.lat,
      lng: step.start_location.lng
    }));
    // Check for risks/incidents along the route
    const risks = await getRisksOnRoute(routePoints);
    // If risks found, mark route as unsafe and suggest alternative (not implemented: alternative route logic)
    const safe = risks.length === 0;
    res.json({ safe, risks, route });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get safe route', details: err.message });
  }
});

module.exports = router;
