import { Router } from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { UserAttributes } from '../models/User.js';

// Import controllers
import * as authController from '../controllers/authController.js';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: UserAttributes;
    }
  }
}

const router = Router();

// Controller function type that matches Express's RequestHandler
type ControllerFunction = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Helper to safely wrap controller functions with proper typing
const wrapController = (fn: ControllerFunction) => 
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req as AuthRequest, res, next);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler;

// Public routes
router.post(
  '/register/:role',
  wrapController(authController.register as unknown as ControllerFunction)
);

router.post(
  '/login',
  wrapController(authController.login as unknown as ControllerFunction)
);

router.post(
  '/login/user',
  wrapController(authController.userLogin as unknown as ControllerFunction)
);

router.post(
  '/login/admin',
  wrapController(authController.adminLogin as unknown as ControllerFunction)
);

router.post(
  '/login/responder',
  wrapController(authController.responderLogin as unknown as ControllerFunction)
);

// Protected routes
router.get(
  '/me',
  wrapController(authController.getMe as unknown as ControllerFunction)
);

router.put(
  '/profile',
  wrapController(authController.updateProfile as unknown as ControllerFunction)
);

export default router;
