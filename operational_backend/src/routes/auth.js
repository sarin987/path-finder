const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User } = require('../models');
const { JWT_SECRET = 'your-secret-key', JWT_EXPIRES_IN = '24h' } = process.env;

// Helper function to clean phone number
const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters and ensure it starts with country code
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.startsWith('91') && cleaned.length === 12 ? cleaned : `91${cleaned}`;
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      role: user.role,
      firebase_uid: user.firebase_uid
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Register a new user with phone
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt with data:', req.body);
    const { name, phone, password, firebase_uid, role = 'user' } = req.body;

    // Validate required fields
    if (!name || !phone || !password || !firebase_uid) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!phone) missingFields.push('phone');
      if (!password) missingFields.push('password');
      if (!firebase_uid) missingFields.push('firebase_uid');

      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Clean and validate phone number
    const cleanPhone = cleanPhoneNumber(phone);
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
        field: 'phone'
      });
    }

    // Check if phone or firebase_uid already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { phone: cleanPhone },
          { firebase_uid }
        ]
      },
      attributes: ['id', 'phone', 'firebase_uid']
    });

    if (existingUser) {
      if (existingUser.phone === cleanPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already registered',
          field: 'phone',
          code: 'PHONE_ALREADY_REGISTERED'
        });
      }
      if (existingUser.firebase_uid === firebase_uid) {
        return res.status(400).json({
          success: false,
          message: 'This device is already registered',
          field: 'firebase_uid',
          code: 'DEVICE_ALREADY_REGISTERED'
        });
      }
    }
    
    // Create user with cleaned phone number and trimmed inputs
    const userData = {
      name: name.trim(),
      phone: cleanPhone,
      password: password,
      firebase_uid: firebase_uid.trim()
    };
    
    // Only add role if it's a valid role
    const validRoles = ['user', 'admin', 'responder'];
    if (role && validRoles.includes(role.toLowerCase())) {
      userData.role = role.toLowerCase();
    }
    
    console.log('Creating user with data:', { ...userData, password: '***' });
    
    try {
      const user = await User.create(userData);
      console.log('User created successfully:', user.id);
      
      // Generate JWT token
      const token = generateToken(user);
      
      return res.status(201).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          token
        }
      });
    } catch (createError) {
      console.error('Error creating user:', {
        message: createError.message,
        name: createError.name,
        stack: createError.stack,
        ...(createError.errors && { 
          sequelizeErrors: createError.errors.map(e => ({
            message: e.message,
            type: e.type,
            path: e.path,
            value: e.value
          }))
        })
      });
      
      // Handle specific database errors
      if (createError.name === 'SequelizeUniqueConstraintError') {
        const field = createError.errors[0]?.path;
        return res.status(400).json({
          success: false,
          message: `${field} already exists`,
          field,
          code: `${field.toUpperCase()}_ALREADY_EXISTS`
        });
      }
      
      throw createError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...(error.errors && { 
        sequelizeErrors: error.errors.map(e => ({
          message: e.message,
          type: e.type,
          path: e.path,
          value: e.value
        }))
      })
    });
    
    res.status(500).json({
      success: false,
      message: 'Error registering user. Please try again later.',
      code: 'REGISTRATION_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        details: {
          name: error.name,
          ...(error.errors && { errors: error.errors })
        }
      })
    });
  }
});

// Login user with phone and password
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt with phone:', req.body);
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      const missingFields = [];
      if (!phone) missingFields.push('phone');
      if (!password) missingFields.push('password');
      
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }
    
    // Clean and validate phone number
    const cleanPhone = cleanPhoneNumber(phone);
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
        field: 'phone'
      });
    }
    
    // Find user by phone with password included
    const user = await User.scope('withPassword').findOne({ 
      where: { phone: cleanPhone } 
    });
    
    console.log('User found:', user ? `Yes (ID: ${user.id})` : 'No');
    
    if (!user) {
      console.log('User not found with phone:', cleanPhone);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid phone number or password',
        field: 'phone',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    // Check password using the model's method
    console.log('Validating password...');
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user with phone:', cleanPhone);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid phone number or password',
        field: 'password',
        code: 'INVALID_PASSWORD'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Firebase authentication
router.post('/firebase', async (req, res) => {
  try {
    console.log('Firebase auth attempt:', req.body);
    const { firebase_uid, name, phone } = req.body;
    
    if (!firebase_uid) {
      return res.status(400).json({ 
        success: false,
        message: 'Firebase UID is required',
        field: 'firebase_uid'
      });
    }
    
    // Try to find user by firebase_uid
    let user = await User.findOne({ 
      where: { firebase_uid },
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      // Validate required fields for new user
      if (!name || !phone) {
        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!phone) missingFields.push('phone');
        
        return res.status(400).json({
          success: false,
          message: `New user requires: ${missingFields.join(', ')}`,
          missingFields,
          code: 'NEW_USER_REQUIRED'
        });
      }
      
      // Clean and validate phone number
      const cleanPhone = cleanPhoneNumber(phone);
      if (cleanPhone.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
          field: 'phone'
        });
      }
      
      // Check if phone number is already registered
      const existingUser = await User.findOne({ where: { phone: cleanPhone } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already registered',
          field: 'phone'
        });
      }
      
      // Create new user
      user = await User.create({
        name: name.trim(),
        phone: cleanPhone,
        firebase_uid: firebase_uid.trim(),
        password: firebase_uid, // Will be hashed by the beforeCreate hook
        role: 'user'
      });
      
      console.log('New user created via Firebase auth:', user.id);
    } else if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error('Firebase auth error:', error);
    res.status(500).json({ message: 'Error authenticating with Firebase', error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // req.user is set by the authenticateToken middleware
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data (password is already excluded by the middleware)
    res.json(req.user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

module.exports = router;
