import { Response, NextFunction } from 'express';
import { db } from '../models';
import { AuthRequest } from '../middleware/auth';

const { Emergency, User } = db;

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get counts from the database using Sequelize
    const [emergencies, activeResponders, resolvedCases, responseTime] = await Promise.all([
      Emergency.count(),
      User.count({ where: { role: 'responder', is_active: true } }),
      Emergency.count({ where: { status: 'resolved' } }),
      Emergency.findAll({
        attributes: [
          [db.sequelize.fn('AVG', db.sequelize.literal('TIMESTAMPDIFF(MINUTE, created_at, updated_at)')), 'avgResponseTime']
        ],
        raw: true
      })
    ]);

    const stats = {
      emergencies,
      activeResponders,
      resolvedCases,
      avgResponseTime: Math.round(responseTime[0].avgResponseTime || 0)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
  }
};

export const getRecentEmergencies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const emergencies = await Emergency.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'responder', attributes: ['id', 'name', 'email'], required: false }
      ]
    });

    res.json(emergencies);
  } catch (error) {
    console.error('Error fetching recent emergencies:', error);
    next(error);
  }
};
