const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @desc    User login
// @route   POST /api/auth/user/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    // Basic validation
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both phone and password',
        code: 'MISSING_CREDENTIALS'
      });
    }

    console.log('User login attempt:', { phone });
    
    // Format phone number (remove any non-digit characters and ensure it starts with 91)
    const formattedPhone = phone.replace(/\D/g, '');
    
    // Find user by phone with password included
    const user = await User.scope('withPassword').findOne({ 
      where: { 
        phone: formattedPhone,
        role: 'user' // Ensure we're only logging in users with role 'user'
      },
      attributes: { include: ['password'] } // Explicitly include password
    });
    
    console.log('User query result:', user ? 'User found' : 'User not found');
    
    // Check if user exists
    if (!user) {
      console.log('User not found with phone:', formattedPhone);
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    console.log('User found with ID:', user.id);
    console.log('User has password:', !!user.password);
    
    // Check if user has a password
    if (!user.password) {
      console.log('No password set for user:', user.id);
      return res.status(401).json({
        success: false,
        message: 'Account not properly set up. Please reset your password.',
        code: 'ACCOUNT_NOT_SETUP'
      });
    }

    // Check if password is correct using the model's instance method
    try {
      const isPasswordValid = await user.validPassword(password);
      console.log('Password validation result:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('Invalid password for user:', user.id);
        return res.status(401).json({
          success: false,
          message: 'Invalid phone number or password',
          code: 'INVALID_CREDENTIALS'
        });
      }
    } catch (error) {
      console.error('Error validating password:', error);
      console.log('Password validation failed - provided password:', password);
      console.log('Stored password hash:', user.password ? '[HASH PRESENT]' : '[MISSING]');
      
      return res.status(500).json({
        success: false,
        message: 'Error during authentication',
        code: 'AUTH_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    
    // Return token and user data (without password)
    const userData = user.get({ plain: true });
    delete userData.password;
    
    console.log('Login successful for user:', user.id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: 'user'
      }
    });
    
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  loginUser
};
