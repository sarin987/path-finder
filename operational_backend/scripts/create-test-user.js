const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const User = require('../models/User');

async function createTestUser() {
  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);
    
    // Create the test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user',
      phone: '+1234567890',
      isActive: 1  // Using 1 for true in MySQL
    });
    
    console.log('Test user created successfully:', user.toJSON());
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await sequelize.close();
  }
}

createTestUser();
