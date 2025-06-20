import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import { Op } from 'sequelize';
import { io } from '../server.js';

// Role to model mapping
const roleToModel = {
  police: models.PoliceUser,
  ambulance: models.AmbulanceUser,
  fire: models.FireUser,
  parent: models.ParentUser
};

// List of valid roles
const validRoles = Object.keys(roleToModel);

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user with role
// @route   POST /api/auth/register/:role
// @access  Public
export const register = async (req, res) => {
  try {
    const { role } = req.params;
    const { name, email, password, phone } = req.body;

    // Validate role
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists in any role table
    const userExists = await Promise.any(
      Object.values(roleToModel).map(Model => 
        Model.findOne({ where: { email } })
      )
    );

    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Get the appropriate model based on role
    const UserModel = roleToModel[role];
    
    // Create user in the specific role table
    const user = await UserModel.create({
      name,
      email,
      password,
      phone
    });

    // Generate token
    const token = generateToken(user.id, role);

    // Remove password from response
    const userResponse = user.get({ plain: true });
    delete userResponse.password;

    res.status(201).json({
      ...userResponse,
      role,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Search for user in all role tables
    const userResults = await Promise.all(
      Object.entries(roleToModel).map(async ([role, Model]) => {
        const user = await Model.scope('withPassword').findOne({ where: { email } });
        return user ? { ...user.toJSON(), role } : null;
      })
    );

    // Find the first non-null user (if any)
    const userWithRole = userResults.find(user => user !== null);

    if (!userWithRole) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, userWithRole.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(userWithRole.id, userWithRole.role);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = userWithRole;

    res.json({
      ...userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const { role, id } = req.user;
    
    // Get the appropriate model based on role
    const UserModel = roleToModel[role];
    
    if (!UserModel) {
      return res.status(400).json({ message: 'Invalid user role' });
    }

    const user = await UserModel.findByPk(id);

    if (user) {
      res.json({
        ...user.toJSON(),
        role
      });
    } else {
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
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (user) {
      const { name, email, phone, location } = req.body;
      
      // Update fields if they exist in the request
      if (name) user.name = name;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (location) user.location = location;
      
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
