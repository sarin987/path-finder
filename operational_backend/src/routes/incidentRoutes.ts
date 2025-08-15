import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as os from 'os';
import { fileURLToPath } from 'url';

// Import models
import models from '../models/index.js';

const { Incident, User } = models;

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const INCIDENT_UPLOADS_DIR = path.join(UPLOADS_DIR, 'incidents');

// Ensure uploads directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(INCIDENT_UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directories:', error);
    throw error;
  }
}

// Initialize directories
ensureDirectories().catch(console.error);

const router = Router();

// Define types
interface IncidentRequest extends Request {
  file?: Express.Multer.File;
  user?: any; // Adjust this based on your auth middleware
}

// Get the current file's directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fsSync.existsSync(uploadsDir)) {
  fsSync.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure incident directory exists
const incidentDir = path.join(uploadsDir, 'incidents');
try {
  await fs.access(incidentDir);
} catch (error) {
  await fs.mkdir(incidentDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, INCIDENT_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `incident-${Date.now()}-${uuidv4()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Helper function to upload file to local storage
async function uploadFile(file: Express.Multer.File): Promise<string> {
  if (!file || !file.path) {
    throw new Error('No file provided or file path is missing');
  }

  try {
    // Create a URL that points to the locally stored file
    const publicUrl = `/uploads/incidents/${path.basename(file.path)}`;
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    
    // Clean up the file if there was an error
    try {
      if (file.path) {
        await fs.unlink(file.path);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up file after error:', cleanupError);
    }
    
    throw error;
  }
}

// Helper function to handle the report logic
const handleReport = async (req: IncidentRequest, res: Response) => {
  console.log('--- Incident Report Request Received ---');
  try {
    const { user_id, type, description, recipient, location_lat, location_lng } = req.body;
    console.log('Request body:', req.body);
    
    if (!user_id || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: user_id and type are required' 
      });
    }

    let photo_url: string | null = null;

    // Get user for folder naming
    let user;
    try {
      user = await User.findByPk(user_id);
      console.log('User lookup:', user ? user.name : 'User not found');
    } catch (err) {
      console.error('User lookup error:', err);
    }
    const userName = user ? user.name.replace(/\s+/g, '_') : `user_${user_id}`;

    // Upload photo if present
    if (req.file) {
      try {
        photo_url = await uploadFile(req.file);
        console.log('Photo uploaded successfully:', photo_url);
      } catch (err) {
        console.error('Photo upload error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to upload photo',
          error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
        });
      }
    } else {
      console.log('No photo attached to request.');
    }

    // Store incident in DB
    try {
      const incident = await Incident.create({
        reported_by: user_id,
        type,
        description,
        location_lat: location_lat ? parseFloat(location_lat) : null,
        location_lng: location_lng ? parseFloat(location_lng) : null,
        status: 'reported',
        severity: 'medium' // Add default severity
      });

      console.log('Incident created in DB:', incident.id);

      // Emit real-time event to dashboard via Socket.IO
      try {
        const { io } = require('../server');
        if (io) {
          io.emit('new-incident', incident);
          console.log('Emitted new-incident event via Socket.IO');
        } else {
          console.log('Socket.IO instance not found');
        }
      } catch (e) {
        console.error('Socket.IO emit error:', e);
      }

      const responseData = {
        success: true, 
        incident: {
          ...incident.get({ plain: true }),
          userName: user?.name || null,
          role: user?.role || null
        } 
      };
      // Don't return the response, just send it
      res.status(201).json(responseData);
      return;
    } catch (err) {
      console.error('Failed to create incident in DB:', err);
      throw err;
    }
  } catch (error) {
    console.error('Incident report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to report incident',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
    return;
  }
};

// POST /api/incidents/report
router.post('/report', upload.single('photo'), (req: IncidentRequest, res: Response, next: NextFunction) => {
  handleReport(req, res).catch(next);
});

// Helper function to handle getting all incidents
const handleGetIncidents = async (req: Request, res: Response) => {
  console.log('[DEBUG] GET /api/incidents called');
  try {
    const incidents = await Incident.findAll({
      order: [['timestamp', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['name', 'email', 'role', 'phone'],
          as: 'user'
        }
      ]
    });

    console.log(`[DEBUG] Fetched ${incidents.length} incidents`);
    
    // Format response data
    const formattedIncidents = incidents.map(incident => {
      const incidentData = incident.toJSON() as any;
      return {
        ...incidentData,
        userName: incidentData.user?.name || 'Unknown User',
        userEmail: incidentData.user?.email || null,
        userRole: incidentData.user?.role || null,
        userPhone: incidentData.user?.phone || null,
        user: undefined // Remove the nested user object
      };
    });

    // Don't return the response, just send it
    res.json(formattedIncidents);
    return;
  } catch (error) {
    console.error('[ERROR] Failed to fetch incidents:', error);
    res.status(500).json({ 
      error: 'Failed to fetch incidents',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
};

// GET /api/incidents - List all incidents
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  handleGetIncidents(req, res).catch(next);
});

export default router;
