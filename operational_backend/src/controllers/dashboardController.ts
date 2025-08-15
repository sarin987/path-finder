import { Response, NextFunction } from 'express';
import { Op, fn, literal, ModelStatic, Model } from 'sequelize';
import { AuthRequest } from '../middleware/auth.js';

// Import models using ES modules
import { sequelize } from '../config/database.js';
import models, { User } from '../models/index.js';

// Define model types
interface IEmergencyModel extends ModelStatic<Model> {
  count: (options?: any) => Promise<number>;
  findAll: (options?: any) => Promise<Model[]>;
}

interface IUserModel extends ModelStatic<Model> {
  count: (options?: any) => Promise<number>;
}

// Get models with proper typing
const db = sequelize.models as any;
const Emergency = db.Emergency as IEmergencyModel;
const UserModel = User as unknown as IUserModel;

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get counts from the database using Sequelize
    const [emergencies, activeResponders, resolvedCases, responseTime] = await Promise.all([
      Emergency.count(),
      UserModel.count({ where: { role: 'responder', is_active: true } }),
      Emergency.count({ where: { status: 'resolved' } }),
      Emergency.findAll({
        attributes: [
          [fn('AVG', literal('TIMESTAMPDIFF(MINUTE, created_at, updated_at)')), 'avgResponseTime']
        ],
        raw: true
      })
    ]);

    // Type the response from the database
    interface AvgResponseTimeResult {
      avgResponseTime: number | null;
    }

    const stats = {
      emergencies,
      activeResponders,
      resolvedCases,
      avgResponseTime: Math.round((responseTime[0] as unknown as AvgResponseTimeResult).avgResponseTime || 0)
    };

    // Don't return the response, just send it
    res.json(stats);
    return;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
    return;
  }
};

export const getRecentEmergencies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const emergencies = await Emergency.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [
        { model: UserModel, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: UserModel, as: 'responder', attributes: ['id', 'name', 'email'], required: false }
      ]
    });

    // Don't return the response, just send it
    res.json(emergencies);
    return;
  } catch (error) {
    console.error('Error fetching recent emergencies:', error);
    next(error);
    return;
  }
};
