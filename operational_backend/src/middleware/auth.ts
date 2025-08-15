import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';
import User from '../models/User.js';

// Define a minimal user type that matches what we actually use
export interface RequestUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  [key: string]: any;
}

// Create a custom request type that extends Express's Request
export interface AuthRequest<P = {}, ResBody = any, ReqBody = any, ReqQuery = any> 
  extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: RequestUser;
}

// Module augmentation to extend Express's Request type
declare module 'express-serve-static-core' {
  interface Request {
    user?: RequestUser;
  }
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('No token provided in request');
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    console.log('Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    if (!decoded || !decoded.userId) {
      console.log('Invalid token payload:', decoded);
      res.status(403).json({ message: 'Invalid token' });
      return;
    }

    console.log('Fetching user with ID:', decoded.userId);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
      raw: true
    }) as unknown as RequestUser;

    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      res.status(403).json({ message: 'User not found' });
      return;
    }

    console.log('User authenticated successfully:', user.email);
    req.user = user;
    next();
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    } else if (error.name === 'JsonWebTokenError') {
      res.status(403).json({ message: 'Invalid token', code: 'INVALID_TOKEN' });
      return;
    }
    res.status(500).json({ message: 'Authentication failed', code: 'AUTH_ERROR' });
  }
};
