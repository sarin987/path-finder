import express, { Request, Response, Router, NextFunction, RequestHandler } from 'express';
import { check, ValidationChain } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticateToken as auth, AuthRequest } from '../middleware/auth.js';
import { LocationService } from '../services/locationService.js';
import { FileParams } from '../types/request.js';

// Define types for the request objects
type LocationRequest = AuthRequest & {
  user: {
    id: number;
    role: string;
  };
};

// Define the type for the responder in the filter function
type Responder = {
  role: string;
  [key: string]: any;
};

type AsyncRequestHandler = (
  req: LocationRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;

const router: Router = express.Router();

/**
 * @route   GET /api/locations/responders
 * @desc    Get all active responders' locations
 * @access  Private
 */
const getRespondersValidation: ValidationChain[] = [
  check('role', 'Role is required').optional().isString()
];

router.get('/responders', 
  [auth, ...getRespondersValidation, validateRequest] as RequestHandler[],
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role } = req.query as { role?: string };
      const responders = await LocationService.getActiveResponders(role);
      return res.json(responders);
    } catch (error) {
      return next(error);
    }
  }) as unknown as RequestHandler
);

/**
 * @route   POST /api/locations/update
 * @desc    Update current user's location
 * @access  Private
 */
const updateLocationValidation: ValidationChain[] = [
  check('lat', 'Latitude is required').isFloat({ min: -90, max: 90 }),
  check('lng', 'Longitude is required').isFloat({ min: -180, max: 180 }),
  check('status', 'Status is required').isIn(['available', 'busy', 'offline'])
];

router.post('/update', 
  [auth, ...updateLocationValidation, validateRequest] as RequestHandler[],
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lat, lng, status } = req.body as { 
        lat: string; 
        lng: string; 
        status: 'available' | 'busy' | 'offline' 
      };
      
      const userId = (req as any).user?.id as number | undefined;
      const userRole = (req as any).user?.role as 'police' | 'ambulance' | 'fire' | 'security' | 'admin' | 'responder' | 'user';
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const location = await LocationService.updateResponderLocation(
        userId,
        userRole,
        parseFloat(lat),
        parseFloat(lng),
        status
      );
      
      return res.json(location);
    } catch (error) {
      return next(error);
    }
  }) as unknown as RequestHandler
);

/**
 * @route   GET /api/locations/nearby-responders
 * @desc    Find nearby responders within a certain radius
 * @access  Private
 */
const nearbyRespondersValidation: ValidationChain[] = [
  check('lat', 'Latitude is required').isFloat({ min: -90, max: 90 }),
  check('lng', 'Longitude is required').isFloat({ min: -180, max: 180 }),
  check('radius', 'Radius must be a number').optional().isInt({ min: 100, max: 10000 })
];

router.get(
  '/nearby-responders',
  [auth, ...nearbyRespondersValidation, validateRequest] as RequestHandler[],
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lat, lng, radius, role } = req.query as {
        lat: string;
        lng: string;
        radius?: string;
        role?: string;
      };

      const responders = await LocationService.findNearbyResponders(
        parseFloat(lat),
        parseFloat(lng),
        radius ? parseInt(radius) : 5000 // Default 5km radius if not specified
      );
      
      // If role filter is provided, filter the results
      const filteredResponders = role 
        ? responders.filter((responder: Responder) => responder.role === role)
        : responders;
      
      return res.json(filteredResponders);
    } catch (error) {
      return next(error);
    }
  }) as unknown as RequestHandler
);

export default router;
