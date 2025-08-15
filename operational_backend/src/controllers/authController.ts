import { type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, { type UserAttributes, type UserRole } from '../models/User.js';
import { JWT_SECRET } from '../config/constants.js';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: UserAttributes;
    }
  }
}

// Type for login request body
type LoginBody = {
  email: string;
  password: string;
};

// Type for register request body
type RegisterBody = {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  address?: string;
};

// Type for update profile request body
type UpdateProfileBody = {
  name?: string;
  phone?: string | null;
  address?: string | null;
};

// Register a new user
export const register = async (
  req: Request<{}, {}, RegisterBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, role = 'user', phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || null,
      address: address || null,
      is_active: true
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data without password using object destructuring
    const { password: _, ...userData } = user.toJSON();

    res.status(201).json({
      user: userData,
      token
    });
  } catch (error) {
    next(error);
  }
};

// Generic login function
const loginUser = async (req: Request<{}, {}, LoginBody>, res: Response, role?: UserRole) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if account is active
    if (!user.is_active) {
      res.status(403).json({ message: 'Account is deactivated' });
      return;
    }

    // Check if role matches (if specified)
    if (role && user.role !== role) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = user.toJSON() as Omit<typeof user, 'password'> & { password?: string };
    delete userResponse.password;

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login endpoints
export const login = (req: Request<{}, {}, LoginBody>, res: Response, next: NextFunction) => 
  loginUser(req, res);

export const userLogin = (req: Request<{}, {}, LoginBody>, res: Response, next: NextFunction) => 
  loginUser(req, res, 'user');

export const adminLogin = (req: Request<{}, {}, LoginBody>, res: Response, next: NextFunction) => 
  loginUser(req, res, 'admin');

export const responderLogin = (req: Request<{}, {}, LoginBody>, res: Response, next: NextFunction) => 
  loginUser(req, res, 'responder');

// Get current user profile
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // The user should be attached to the request by the authenticateToken middleware
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    // Find the user by ID
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Exclude password from the response
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
export const updateProfile = async (
  req: Request<{}, {}, UpdateProfileBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { name, phone, address } = req.body;
    const userId = req.user.id;

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update user data
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    // Return updated user data without password
    const userResponse = user.toJSON() as Omit<typeof user, 'password'> & { password?: string };
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
