const { sequelize, testConnection } = require('../sequelize-config');
const { User } = require('../src/models');
const bcrypt = require('bcrypt');

async function setupTestUser() {
  try {
    // Test database connection
    await testConnection();
    console.log('✅ Database connection established successfully');

    // Drop and recreate all tables
    await sequelize.sync({ force: true });
    console.log('✅ Database synced');

    // Create test user with plain text password (it will be hashed by the model hook)
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'test123', // This will be hashed by the model hook
      role: 'user',
      isActive: 1,
      // createdAt and updatedAt will be set automatically by Sequelize
    });

    console.log('✅ Test user created successfully:');
    console.log({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

    // Verify the password
    const isValid = await user.validatePassword('test123');
    console.log('🔑 Password verification:', isValid ? '✅ Valid' : '❌ Invalid');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up test user:', error);
    process.exit(1);
  }
}

setupTestUser();
