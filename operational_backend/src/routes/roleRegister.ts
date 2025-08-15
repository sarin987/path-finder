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

// User interface for registration
interface IRegisterUser extends Omit<RequestUser, 'name' | 'email'> {
  // Required fields
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
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  // Remove leading 91 if it exists (to prevent double 91)
  if (cleaned.startsWith('91') && cleaned.length >= 10) {
    cleaned = cleaned.substring(2);
  }
  // Ensure the number is exactly 10 digits
  return cleaned.length === 10 ? `91${cleaned}` : '';
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
    const { name, phone, password, email } = req.body;
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
    const whereClause: WhereOptions<IRegisterUser> = {
      [Op.or]: [
        { email },
        { phone: cleanedPhone },
      ]
    };

    const existingUser = await User.findOne({
      where: whereClause as WhereOptions<UserAttributes>,
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this phone/email already exists' 
      });
    }

    // Hash password if provided
    let hashedPassword = '';
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Create user with required fields
    const user = await User.create({
      name,
      email,
      phone: cleanedPhone || null,
      password: hashedPassword,
      role: role as UserRole,
      is_active: true
    } as UserAttributes);

    // Generate token
    const userForToken = {
      id: user.id,
      name: user.name,
      email: user.email || '',
      role: user.role as UserRole,
    };

    const token = generateToken(userForToken);

    // Return user data (excluding sensitive information)
    const userResponse = user.get({ plain: true }) as any;
    if (userResponse && 'password' in userResponse) {
      delete userResponse.password;
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
