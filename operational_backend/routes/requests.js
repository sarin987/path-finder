const express = require('express');
const router = express.Router();
const SOSRequest = require('../models/SOSRequest');
const { Op } = require('sequelize');

// GET /api/requests - Get all requests (optionally filter by responder, status, etc.)
router.get('/', async (req, res) => {
  try {
    // You can add filters as needed, e.g. by responderId, status, etc.
    const { responderId, status, limit = 50, page = 1 } = req.query;
    const where = {};
    if (responderId) where.responder_id = responderId;
    if (status) where.status = status;
    const offset = (page - 1) * limit;
    const { count, rows } = await SOSRequest.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    res.json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      data: rows
    });
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

module.exports = router;
