const { sequelize } = require('../sequelize-config');
const { DataTypes } = require('sequelize');

async function initDatabase() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Define the User model
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('user', 'admin', 'responder'),
        defaultValue: 'user',
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'isActive',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'createdAt',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updatedAt',
      },
    }, {
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const bcrypt = require('bcrypt');
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    });

    // Drop role_locations table first if it exists (to handle foreign key constraints)
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });
      await sequelize.query('DROP TABLE IF EXISTS `role_locations`', { raw: true });
      console.log('✅ Dropped role_locations table');
    } catch (error) {
      console.log('ℹ️ No role_locations table to drop');
    }

    // Sync the model with the database
    await User.sync({ force: true });
    console.log('✅ User table created successfully');
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });

    // Create admin user with provided credentials
    const now = new Date();
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Sarink',
      phone: '9604023406',
      role: 'admin',
      isActive: true,
      createdAt: now,
      updatedAt: now
    });

    console.log('✅ Admin user created successfully');
    console.log({
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      phone: adminUser.phone,
      role: adminUser.role,
      isActive: adminUser.isActive,
      createdAt: adminUser.createdAt,
      updatedAt: adminUser.updatedAt,
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
