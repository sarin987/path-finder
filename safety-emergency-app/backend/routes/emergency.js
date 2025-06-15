import express from 'express';
import { 
  createEmergency, 
  getEmergencies, 
  getEmergencyById, 
  updateEmergencyStatus,
  assignEmergency
} from '../controllers/emergencyController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected and require authentication
router.use(authenticateToken);

// Create a new emergency
router.post('/', createEmergency);

// Get all emergencies (with filters)
router.get('/', getEmergencies);

// Get emergency by ID
router.get('/:id', getEmergencyById);

// Update emergency status
router.put('/:id/status', updateEmergencyStatus);

// Assign emergency to a responder
router.put(
  '/:id/assign', 
  authorizeRoles('admin', 'responder'),
  assignEmergency
);

export default router;
