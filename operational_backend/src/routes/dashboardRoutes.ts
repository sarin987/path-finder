import { Router } from 'express';
import { getDashboardStats, getRecentEmergencies } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protected routes - require authentication
router.get('/stats', authenticateToken, getDashboardStats);
router.get('/recent-emergencies', authenticateToken, getRecentEmergencies);

export default router;
