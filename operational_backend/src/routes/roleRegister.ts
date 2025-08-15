import express, { Request, Response, Router, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Op, WhereOptions } from 'sequelize';
import User, { UserAttributes } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';

// Define user role type
type UserRole = 'user' | 'responder' | 'admin';

// Import RequestUser type from auth middleware
import { RequestUser } from '../middleware/auth.js';

// Extend the RequestUser type to include firebase_uid
interface IUserWithFirebase extends Omit<RequestUser, 'name' | 'email'> {
  firebase_uid?: string | null;
  // Required fields from RequestUser
  name: string;
  email: string;
  // Optional fields
  phone?: string | null;
}

const router: Router = express.Router();
const { JWT_SECRET = 'your-secret-key', JWT_EXPIRES_IN = '24h' } = process.env;

// Helper function to clean phone number
const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.startsWith('91') && cleaned.length === 12 ? cleaned : `91${cleaned}`;
};

// Interface for token payload
interface TokenPayload {
  id: number;
  name: string;
  email: string;
  role: string;
}

// Helper function to generate JWT token
const generateToken = (user: TokenPayload): string => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET as jwt.Secret,
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
};

// Register a new user with a specific role
router.post('/register/:role', (async (req: Request<{ role: string }>, res: Response) => {
  try {
    const { name, phone, password, firebase_uid, email } = req.body;
    const role = req.params.role as UserRole;

    // Validate role
    if (!['user', 'responder', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Allowed roles are: user, responder, admin' 
      });
    }

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and phone are required' 
      });
    }

    // Clean and validate phone number
    const cleanedPhone = cleanPhoneNumber(phone);
    if (!cleanedPhone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number' 
      });
    }

    // Check if user already exists
    const whereClause: WhereOptions<IUserWithFirebase> = {
      [Op.or]: [
        { phone: cleanedPhone },
        ...(email ? [{ email }] : [])
      ]
    };

    // Add firebase_uid to the where clause if it exists
    if (firebase_uid) {
      (whereClause[Op.or] as any[]).push({ firebase_uid });
    }

    const existingUser = await User.findOne({
      where: whereClause as any, // Type assertion needed due to firebase_uid
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this phone/email/Firebase UID already exists' 
      });
    }

    // Hash password if provided
    let hashedPassword = '';
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Create new user with the specified role
    const userData = {
      name,
      phone: cleanedPhone,
      email: email || undefined,
      password: hashedPassword || undefined,
      role,
      is_active: true,
      firebase_uid: firebase_uid || undefined,
    };

    const user = await User.create(userData as any); // Type assertion needed due to firebase_uid

    // Generate token
    const userForToken = {
      id: user.id,
      name: user.name,
      email: user.email || '',
      role: user.role as UserRole,
    };

    const token = generateToken(userForToken);

    // Return user data (excluding sensitive information)
    const userResponse = { ...user.get({ plain: true }) };
    delete (userResponse as any).password;
    if ('firebase_uid' in userResponse) {
      delete (userResponse as any).firebase_uid;
    }

    return res.status(201).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ 
      success: false, 
      message: 'Error during registration',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    });
  }
}) as unknown as RequestHandler);

export default router;
