const express = require('express');
const router = express.Router();

// Example: List of emergency services
router.get('/', (req, res) => {
  res.json([
    { type: 'ambulance', label: 'Ambulance Service' },
    { type: 'fire', label: 'Fire Service' },
    { type: 'police', label: 'Police Service' }
  ]);
});

module.exports = router;
