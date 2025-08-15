import { type Request, type Response, type NextFunction } from 'express';
import { type Model, type ModelStatic, Op, type WhereOptions } from 'sequelize';
import { type AuthRequest } from '../middleware/auth.js';
import { type IncidentAttributes, type IncidentCreationAttributes } from '../models/Incident.js';
import models from '../models/index.js';
import { type UserAttributes, type UserRole } from '../models/User.js';

// Define types for the request bodies
type CreateEmergencyBody = {
  type: string;
  description: string;
  status: string;
  location_lat?: number;
  location_lng?: number;
  severity: 'low' | 'medium' | 'high';
};

type AssignEmergencyBody = {
  assignedTo: number;
};

// Define the incident instance type
type IncidentInstance = Model<IncidentAttributes, IncidentCreationAttributes> & IncidentAttributes;

// Type for the models
interface TypedModels {
  User: ModelStatic<Model<any, any>> & {
    findByPk: (id: number | string, options?: any) => Promise<Model<any, any> | null>;
    findOne: (options?: any) => Promise<Model<any, any> | null>;
  };
  Incident: ModelStatic<IncidentInstance> & {
    create: (values?: IncidentCreationAttributes, options?: any) => Promise<IncidentInstance>;
    findAll: (options?: any) => Promise<IncidentInstance[]>;
    findByPk: (id: number | string, options?: any) => Promise<IncidentInstance | null>;
    findAndCountAll: (options?: any) => Promise<{ 
      count: number; 
      rows: IncidentInstance[] 
    }>;
    update: (values: Partial<IncidentAttributes>, options: any) => Promise<[number, IncidentInstance[]]>;
    count: (options?: any) => Promise<number>;
  };
  [key: string]: any;
}

// Cast the models to typed models
const typedModels = models as unknown as TypedModels;

// Interface for emergency data
interface EmergencyData extends Omit<IncidentCreationAttributes, 'id' | 'created_at' | 'updated_at'> {
  type: string;
  description: string;
  status: string;
  location_lat?: number;
  location_lng?: number;
  reported_by: number;
  assigned_to?: number;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Create a new emergency
 */
export const createEmergency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, description, location_lat, location_lng, severity } = req.body;
    const userId = (req as any).user?.id;

    if (!type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Type and description are required fields'
      });
    }

    const emergencyData: EmergencyData = {
      type,
      description,
      status: 'reported',
      reported_by: userId,
      severity: severity || 'medium'
    };

    if (location_lat && location_lng) {
      emergencyData.location_lat = parseFloat(location_lat);
      emergencyData.location_lng = parseFloat(location_lng);
    }

    const user = req.user as UserAttributes;
    const incident = await typedModels.Incident.create({
      ...req.body,
      reported_by: user.id,
      status: 'reported',
    });

    return res.status(201).json({
      success: true,
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

// Type for query parameters
type GetEmergenciesQuery = {
  status?: string;
  severity?: 'low' | 'medium' | 'high';
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: string;
  offset?: string;
};

/**
 * Get all emergencies with optional filters
 */
export const getEmergencies = async (
  req: AuthRequest<{}, {}, {}, GetEmergenciesQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, severity, type, startDate, endDate, limit, offset } = req.query;
    const where: WhereOptions<IncidentAttributes> = {};

    // Apply filters if provided
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (type) where.type = type;

    // Apply date range filter
    if (startDate || endDate) {
      where.created_at = {} as any; // Type assertion since Op.gte/Op.lte are not directly assignable
      if (startDate) (where.created_at as any)[Op.gte] = new Date(startDate);
      if (endDate) (where.created_at as any)[Op.lte] = new Date(endDate);
    }

    // For non-admin users, only show their reported or assigned emergencies
    if (req.user?.role !== 'admin') {
      where[Op.or] = [
        { reported_by: req.user?.id },
        { assigned_to: req.user?.id }
      ];
    }

    // Parse pagination parameters
    const pageSize = limit ? parseInt(limit, 10) : 10;
    const page = offset ? parseInt(offset, 10) : 0;

    const { count, rows: emergencies } = await (models as TypedModels).Incident.findAndCountAll({
      where,
      include: [
        {
          model: (models as TypedModels).User,
          as: 'reporter',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: (models as TypedModels).User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: page * pageSize
    });

    res.json({
      total: count,
      page: page + 1,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
      data: emergencies
    });
  } catch (error) {
    console.error('Get emergencies error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch emergencies',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Type for route parameters
type GetEmergencyByIdParams = {
  id: string;
};

/**
 * Get emergency by ID
 */
export const getEmergencyById = async (
  req: AuthRequest<GetEmergencyByIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Emergency ID is required' });
    }

    const emergency = await (models as TypedModels).Incident.findByPk(id, {
      include: [
        {
          model: (models as TypedModels).User,
          as: 'reporter',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: (models as TypedModels).User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    // Check if the user has permission to view this emergency
    if (req.user?.role !== 'admin' && 
        emergency.get('reported_by') !== req.user?.id && 
        emergency.get('assigned_to') !== req.user?.id) {
      return res.status(403).json({ message: 'Not authorized to view this emergency' });
    }

    // Create a clean response object
    const response = {
      id: emergency.id,
      type: emergency.type,
      description: emergency.description,
      status: emergency.status,
      severity: emergency.severity,
      location_lat: emergency.location_lat,
      location_lng: emergency.location_lng,
      reported_by: emergency.reported_by,
      assigned_to: emergency.assigned_to,
      created_at: emergency.created_at,
      updated_at: emergency.updated_at,
      reporter: (emergency as any).reporter, // Type assertion for included association
      assignee: (emergency as any).assignee  // Type assertion for included association
    };

    res.json(response);
  } catch (error) {
    console.error('Get emergency by ID error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch emergency',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Type for update status route parameters
type UpdateStatusParams = {
  id: string;
};

// Type for update status request body
type UpdateStatusBody = {
  status: string;
};

// Update emergency status
export const updateEmergencyStatus = async (
  req: AuthRequest<UpdateStatusParams, {}, UpdateStatusBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Find the emergency
    const emergency = await (models as TypedModels).Incident.findByPk(id);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    // Check permissions - Only admin or reporter can update status
    if (req.user?.role !== 'admin' && emergency.get('reported_by') !== userId) {
      return res.status(403).json({ 
        message: 'Not authorized to update this emergency' 
      });
    }

    // Validate status value
    const validStatuses = ['reported', 'in_progress', 'resolved', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update status
    await emergency.update({ 
      status,
      updated_at: new Date()
    });

    // Get updated emergency with associations
    const updatedEmergency = await (models as TypedModels).Incident.findByPk(id, {
      include: [
        {
          model: (models as TypedModels).User,
          as: 'reporter',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: (models as TypedModels).User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!updatedEmergency) {
      return res.status(500).json({ message: 'Failed to retrieve updated emergency' });
    }

    // Create a clean response object with type assertion
    const response = {
      id: updatedEmergency.get('id') as number,
      type: updatedEmergency.get('type') as string,
      description: updatedEmergency.get('description') as string,
      status: updatedEmergency.get('status') as string,
      severity: updatedEmergency.get('severity') as 'low' | 'medium' | 'high',
      location_lat: updatedEmergency.get('location_lat') as number | null,
      location_lng: updatedEmergency.get('location_lng') as number | null,
      reported_by: updatedEmergency.get('reported_by') as number,
      assigned_to: updatedEmergency.get('assigned_to') as number | null,
      created_at: updatedEmergency.get('created_at') as Date,
      updated_at: updatedEmergency.get('updated_at') as Date,
      reporter: (updatedEmergency as any).reporter,
      assignee: (updatedEmergency as any).assignee
    };

    return res.json(response);
  } catch (error) {
    console.error('Update emergency status error:', error);
    next(error);
  }
};

// Type for assign emergency route parameters
type AssignEmergencyParams = {
  id: string;
};

// Assign emergency to a responder
export const assignEmergency = async (
  req: AuthRequest<AssignEmergencyParams, {}, AssignEmergencyBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!assignedTo) {
      return res.status(400).json({ message: 'Responder ID is required' });
    }

    // Find the emergency
    const emergency = await (models as TypedModels).Incident.findByPk(id);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    // Check if the assigned user exists and is a responder
    const responder = await (models as TypedModels).User.findByPk(assignedTo);
    if (!responder || responder.get('role') !== 'responder') {
      return res.status(400).json({ message: 'Invalid responder' });
    }

    // Check permissions - Only admin or reporter can assign
    if (req.user?.role !== 'admin' && emergency.get('reported_by') !== userId) {
      return res.status(403).json({ 
        message: 'Not authorized to assign this emergency' 
      });
    }

    // Update assignment
    await emergency.update({ 
      assigned_to: assignedTo,
      status: 'assigned',
      updated_at: new Date()
    });

    // Get updated emergency with associations
    const updatedEmergency = await (models as TypedModels).Incident.findByPk(id, {
      include: [
        {
          model: (models as TypedModels).User,
          as: 'reporter',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: (models as TypedModels).User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!updatedEmergency) {
      return res.status(500).json({ message: 'Failed to retrieve updated emergency' });
    }

    // Create a clean response object with type assertion
    const response = {
      id: updatedEmergency.get('id') as number,
      type: updatedEmergency.get('type') as string,
      description: updatedEmergency.get('description') as string,
      status: updatedEmergency.get('status') as string,
      severity: updatedEmergency.get('severity') as 'low' | 'medium' | 'high',
      location_lat: updatedEmergency.get('location_lat') as number | null,
      location_lng: updatedEmergency.get('location_lng') as number | null,
      reported_by: updatedEmergency.get('reported_by') as number,
      assigned_to: updatedEmergency.get('assigned_to') as number | null,
      created_at: updatedEmergency.get('created_at') as Date,
      updated_at: updatedEmergency.get('updated_at') as Date,
      reporter: (updatedEmergency as any).reporter,
      assignee: (updatedEmergency as any).assignee
    };

    return res.json(response);
  } catch (error) {
    console.error('Assign emergency error:', error);
    next(error);
  }
};

export default {
  createEmergency,
  getEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
  assignEmergency
};
