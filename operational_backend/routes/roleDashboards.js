const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const router = express.Router();

// Role-based dashboard routes
router.get('/police/dashboard', (req, res) => dashboardController.getDashboardForRole(req, res, 'police'));
router.get('/ambulance/dashboard', (req, res) => dashboardController.getDashboardForRole(req, res, 'ambulance'));
router.get('/fire/dashboard', (req, res) => dashboardController.getDashboardForRole(req, res, 'fire'));
router.get('/admin/dashboard', (req, res) => dashboardController.getDashboardForRole(req, res, 'admin'));

module.exports = router;
