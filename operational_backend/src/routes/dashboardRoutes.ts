import { Router, Request, Response, NextFunction } from 'express';
import { getDashboardStats, getRecentEmergencies } from '../controllers/dashboardController.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Helper function to wrap async route handlers
const asyncHandler = (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  };
};

// Protected routes - require authentication
router.get('/stats', 
  authenticateToken as any, // Type assertion to avoid type mismatch
  asyncHandler(async (req, res, next) => {
    await getDashboardStats(req, res, next);
  })
);

router.get('/recent-emergencies', 
  authenticateToken as any, // Type assertion to avoid type mismatch
  asyncHandler(async (req, res, next) => {
    await getRecentEmergencies(req, res, next);
  })
);

export default router;
