const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const Admin = require('../models/Admin');
const Responder = require('../models/Responder');
const User = require('../models/User');

const validRoles = ['admin', 'police', 'ambulance', 'fire'];

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const formatPhone = (phone) => {
  // Always store/check as +91XXXXXXXXXX
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.startsWith('+91') && cleaned.length === 13) return cleaned;
  return `+91${cleaned}`;
};

// @desc    Register a new user with role
// @route   POST /api/auth/register/:role
// @access  Public
const register = async (req, res) => {
  try {
    const { role } = req.params;
    const { name, phone, password, gender, email } = req.body;

    // Validate role
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid role',
        code: 'INVALID_ROLE'
      });
    }

    // Format and validate phone number
    const formattedPhone = formatPhone(phone);
    if (formattedPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
        field: 'phone',
        code: 'INVALID_PHONE_FORMAT'
      });
    }

    // Check if phone or email already exists in Admin or Responder
    let adminExists = null;
    let responderExists = null;
    if (email) {
      adminExists = await Admin.findOne({ where: { [Op.or]: [{ phone: formattedPhone }, { email }] } });
      responderExists = await Responder.findOne({ where: { [Op.or]: [{ phone: formattedPhone }, { email }] } });
    } else {
      adminExists = await Admin.findOne({ where: { phone: formattedPhone } });
      responderExists = await Responder.findOne({ where: { phone: formattedPhone } });
    }
    // Enforce: phone cannot exist in both tables
    if (adminExists && responderExists) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered as both admin and responder. Please contact support.',
        code: 'PHONE_IN_BOTH_TABLES'
      });
    }
    if (adminExists || responderExists) {
      const userExists = adminExists || responderExists;
      return res.status(400).json({ 
        success: false,
        message: 'Phone number or email already registered',
        field: userExists.phone === formattedPhone ? 'phone' : 'email',
        code: userExists.phone === formattedPhone ? 'PHONE_ALREADY_REGISTERED' : 'EMAIL_ALREADY_REGISTERED'
      });
    }

    let user;
    // Handle registration for Admin and Responder roles
    if (role === 'admin') {
      // Check if admin exists
      const adminExists = await Admin.findOne({ where: { phone: formattedPhone } });
      if (adminExists) {
        return res.status(400).json({ 
          success: false,
          message: 'Admin already exists',
          code: 'ADMIN_ALREADY_EXISTS'
        });
      }
      // Create new admin
      user = await Admin.create({ name, phone: formattedPhone, password });
      const token = generateToken(user.id, 'admin');
      return res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: 'admin'
        }
      });
    } else if (['police', 'ambulance', 'fire'].includes(role)) {
      // Check if responder exists
      const responderExists = await Responder.findOne({ where: { phone: formattedPhone } });
      if (responderExists) {
        return res.status(400).json({ 
          success: false,
          message: 'Responder already exists',
          code: 'RESPONDER_ALREADY_EXISTS'
        });
      }
      // Create new responder
      user = await Responder.create({ name, phone: formattedPhone, password, role });
      const token = generateToken(user.id, role);
      return res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role
        }
      });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { phone, password, role } = req.body;
    const formattedPhone = formatPhone(phone);

    // Enforce: phone cannot exist in both tables
    const adminExists = await Admin.findOne({ where: { phone: formattedPhone } });
    const responderExists = await Responder.findOne({ where: { phone: formattedPhone } });
    if (adminExists && responderExists) {
      return res.status(400).json({
        success: false,
        message: 'Phone number registered as both admin and responder. Please contact support.',
        code: 'PHONE_IN_BOTH_TABLES'
      });
    }

    // If role is specified, use it to determine which table to check first
    let user = null;
    if (role === 'admin') {
      user = adminExists;
      if (user && await bcrypt.compare(password, user.password)) {
        console.log(`[LOGIN] User found in Admin table:`, user.id, user.name, user.phone);
        const token = generateToken(user.id, 'admin');
        return res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: 'admin'
          }
        });
      }
    } else if (['police', 'ambulance', 'fire'].includes(role)) {
      user = responderExists;
      if (user && await bcrypt.compare(password, user.password)) {
        console.log(`[LOGIN] User found in Responder table:`, user.id, user.name, user.phone, user.role);
        const token = generateToken(user.id, user.role);
        return res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role
          }
        });
      }
    } else {
      // No role specified: try admin first, then responder
      if (adminExists && await bcrypt.compare(password, adminExists.password)) {
        console.log(`[LOGIN] User found in Admin table:`, adminExists.id, adminExists.name, adminExists.phone);
        const token = generateToken(adminExists.id, 'admin');
        return res.json({
          token,
          user: {
            id: adminExists.id,
            name: adminExists.name,
            phone: adminExists.phone,
            role: 'admin'
          }
        });
      }
      if (responderExists && await bcrypt.compare(password, responderExists.password)) {
        console.log(`[LOGIN] User found in Responder table:`, responderExists.id, responderExists.name, responderExists.phone, responderExists.role);
        const token = generateToken(responderExists.id, responderExists.role);
        return res.json({
          token,
          user: {
            id: responderExists.id,
            name: responderExists.name,
            phone: responderExists.phone,
            role: responderExists.role
          }
        });
      }
    }
    console.log(`[LOGIN] No user found for phone:`, formattedPhone);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid phone number or password',
      code: 'INVALID_CREDENTIALS'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    User login
// @route   POST /api/auth/login/user
// @access  Public
const userLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const formattedPhone = formatPhone(phone);

    console.log('User login attempt:', { phone: formattedPhone });
    
    // Find user by phone
    const user = await User.findOne({ 
      where: { 
        phone: formattedPhone,
        role: 'user' // Ensure we're only logging in users with role 'user'
      } 
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isPasswordValid);
      
      if (isPasswordValid) {
        const token = generateToken(user.id, 'user');
        return res.json({
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: 'user'
          }
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid phone number or password',
      code: 'INVALID_CREDENTIALS'
    });

  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Admin login
// @route   POST /api/auth/login/admin
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const formattedPhone = formatPhone(phone);

    const admin = await Admin.findOne({ where: { phone: formattedPhone } });
    
    if (admin && await bcrypt.compare(password, admin.password)) {
      const token = generateToken(admin.id, 'admin');
      return res.json({
        success: true,
        token,
        user: {
          id: admin.id,
          name: admin.name,
          phone: admin.phone,
          role: 'admin'
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid admin credentials',
      code: 'INVALID_CREDENTIALS'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Responder login (police, ambulance, fire)
// @route   POST /api/auth/login/responder
// @access  Public
const responderLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const formattedPhone = formatPhone(phone);

    const responder = await Responder.findOne({ 
      where: { 
        phone: formattedPhone,
        role: ['police', 'ambulance', 'fire'] 
      } 
    });
    
    if (responder && await bcrypt.compare(password, responder.password)) {
      const token = generateToken(responder.id, responder.role);
      return res.json({
        success: true,
        token,
        user: {
          id: responder.id,
          name: responder.name,
          phone: responder.phone,
          role: responder.role
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid responder credentials',
      code: 'INVALID_CREDENTIALS'
    });

  } catch (error) {
    console.error('Responder login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const { role, id } = req.user;
    let user;
    if (role === 'admin') {
      user = await Admin.findByPk(id);
      console.log(`[GET_ME] Fetching admin:`, id, user ? user.name : null);
    } else if (['police', 'ambulance', 'fire'].includes(role)) {
      user = await Responder.findByPk(id);
      console.log(`[GET_ME] Fetching responder:`, id, user ? user.name : null, user ? user.role : null);
    }
    if (user) {
      res.json({ ...user.toJSON(), role });
    } else {
      console.log(`[GET_ME] User not found for id:`, id, 'role:', role);
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { role, id } = req.user;
    let user;
    if (role === 'admin') {
      user = await Admin.findByPk(id);
    } else if (['police', 'ambulance', 'fire'].includes(role)) {
      user = await Responder.findByPk(id);
    }
    if (user) {
      const { name, phone } = req.body;
      if (name) user.name = name;
      if (phone) user.phone = phone;
      await user.save();
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  userLogin,
  adminLogin,
  responderLogin,
  getMe,
  updateProfile
};
