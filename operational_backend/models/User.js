import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class User extends Model {
    static associate(models) {
      // Define associations here
      User.hasMany(models.ChatMessage, {
        foreignKey: 'sender_id',
        as: 'sentMessages'
      });
      
      User.hasMany(models.ChatMessage, {
        foreignKey: 'receiver_id',
        as: 'receivedMessages'
      });
      
      User.hasMany(models.Conversation, {
        foreignKey: 'created_by',
        as: 'conversationsCreated'
      });
      
      // Many-to-many with Conversation through conversation_participants
      User.belongsToMany(models.Conversation, {
        through: 'conversation_participants',
        foreignKey: 'user_id',
        otherKey: 'conversation_id',
        as: 'conversations'
      });
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'User\'s full name'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      },
      comment: 'User\'s email address (must be unique)'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Hashed password'
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user',
      comment: 'User role (e.g., admin, user, support)'
    },
    avatar_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL to the user\'s avatar image'
    },
    last_active_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of when the user was last active'
    },
    status: {
      type: DataTypes.ENUM('online', 'offline', 'away', 'busy'),
      allowNull: false,
      defaultValue: 'offline',
      comment: 'Current user status'
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'User preferences and settings',
      get() {
        const rawValue = this.getDataValue('settings');
        return rawValue || {};
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the user account is active'
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of the last login'
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User\'s phone number'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    defaultScope: {
      attributes: { exclude: ['password'] } // Don't return password by default
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] }
      }
    },
    indexes: [
      {
        name: 'idx_user_email',
        fields: ['email'],
        unique: true
      },
      {
        name: 'idx_user_status',
        fields: ['status']
      },
      {
        name: 'idx_user_active',
        fields: ['is_active']
      }
    ]
  });

  // Add hooks
  User.beforeSave(async (user, options) => {
    if (user.changed('password')) {
      // Hash password before saving
      const bcrypt = await import('bcrypt');
      const saltRounds = 10;
      user.password = await bcrypt.hash(user.password, saltRounds);
    }
  });

  // Instance methods
  User.prototype.verifyPassword = async function(candidatePassword) {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(candidatePassword, this.password);
  };

  return User;
};
