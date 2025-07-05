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

// Register a new user with a specific role
router.post('/register/:role', async (req, res) => {
  try {
    const { name, phone, password, firebase_uid, email } = req.body;
    const { role } = req.params;
    if (!name || !phone || !password || !firebase_uid || !email) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!phone) missingFields.push('phone');
      if (!password) missingFields.push('password');
      if (!firebase_uid) missingFields.push('firebase_uid');
      if (!email) missingFields.push('email');
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        field: 'email',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }
    const cleanPhone = cleanPhoneNumber(phone);
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
        field: 'phone'
      });
    }
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { phone: cleanPhone },
          { firebase_uid },
          { email }
        ]
      },
      attributes: ['id', 'phone', 'firebase_uid', 'email']
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
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered',
          field: 'email',
          code: 'EMAIL_ALREADY_REGISTERED'
        });
      }
    }
    const validRoles = ['user', 'admin', 'responder'];
    const userRole = validRoles.includes(role.toLowerCase()) ? role.toLowerCase() : 'user';
    const userData = {
      name: name.trim(),
      phone: cleanPhone,
      password: password,
      firebase_uid: firebase_uid.trim(),
      email: email.trim(),
      role: userRole
    };
    try {
      const user = await User.create(userData);
      const token = generateToken(user);
      return res.status(201).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          token
        }
      });
    } catch (createError) {
      if (createError.name === 'SequelizeUniqueConstraintError') {
        const field = createError.errors[0]?.path;
        return res.status(400).json({
          success: false,
          message: `${field} already exists`,
          field,
          code: `${field.toUpperCase()}_ALREADY_EXISTS`
        });
      }
      throw createError;
    }
  } catch (error) {
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

module.exports = router;
