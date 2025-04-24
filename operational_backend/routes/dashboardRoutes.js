const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Single route to handle all role-based dashboards
router.get('/dashboard', dashboardController.getDashboard);

module.exports = router;
