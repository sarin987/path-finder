const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'responder'),
    defaultValue: 'user'
  },
  phone: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.GEOMETRY('POINT')
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    field: 'isActive',
    defaultValue: true
  },
  // Explicitly define timestamp fields with correct column names
  createdAt: {
    type: DataTypes.DATE,
    field: 'createdAt',
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updatedAt',
    allowNull: false,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW
  },
}, {
  // Model options
  timestamps: true, // Enable timestamps
  underscored: false, // Disable snake_case for this model
  freezeTableName: true, // Prevent Sequelize from pluralizing table names
  // Explicitly set the column names for timestamps
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  // Ensure these column names are used in queries
  name: {
    singular: 'User',
    plural: 'Users'
  },
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  }
});

// Instance method to check password
User.prototype.validPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User;
