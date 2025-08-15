import { Router, type RequestHandler } from 'express';
import type { Request, Response, NextFunction, RequestHandler as ExpressRequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

// Import controllers
import emergencyController from '../controllers/emergencyController.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Type for controller functions with proper request type
type ControllerHandler<T = any, P extends ParamsDictionary = {}, ResBody = any, ReqBody = any> = (
  req: AuthRequest<P, ResBody, ReqBody>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void>;

// Destructure controller methods
const {
  createEmergency, 
  getEmergencies, 
  getEmergencyById, 
  updateEmergencyStatus,
  assignEmergency
} = emergencyController;

const router = Router();

// All routes are protected and require authentication
router.use(authenticateToken as ExpressRequestHandler);

// Create a new emergency
router.post<ParamsDictionary, any, any>('/', asyncHandler(createEmergency as unknown as ControllerHandler));

// Get all emergencies (with filters)
router.get<ParamsDictionary, any, any, any>('/', asyncHandler(getEmergencies as unknown as ControllerHandler));

// Get emergency by ID
router.get<{ id: string }>('/:id', asyncHandler(getEmergencyById as unknown as ControllerHandler));

// Update emergency status
router.put<{ id: string }, any, { status: string }>(
  '/:id/status',
  asyncHandler(updateEmergencyStatus as unknown as ControllerHandler)
);

// Helper function for admin/responder authorization
const requireAdminOrResponder: ExpressRequestHandler = (req: AuthRequest, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'responder')) {
    next();
  } else {
    res.status(403).json({ message: 'Requires admin or responder role' });
  }
};

// Assign emergency to a responder
router.put<{ id: string }, any, { responderId: string }>(
  '/:id/assign',
  requireAdminOrResponder,
  asyncHandler(assignEmergency as unknown as ControllerHandler)
);

export default router;
