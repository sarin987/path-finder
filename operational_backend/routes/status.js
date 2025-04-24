const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;