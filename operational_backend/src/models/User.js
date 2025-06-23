const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');

const hashPassword = async (user) => {
  if (!user.changed('password')) return;
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
};

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // Define associations here if needed
    }

    async validatePassword(password) {
      if (!password || !this.password) return false;
      return bcrypt.compare(password, this.password);
    }

    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      delete values.firebase_uid;
      return values;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Primary key'
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'User\'s full name'
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: {
            msg: 'Phone number is required'
          },
          len: {
            args: [10, 15],
            msg: 'Phone number must be between 10 and 15 digits'
          },
          isNumeric: {
            msg: 'Phone number must contain only numbers'
          }
        },
        comment: 'User\'s phone number (must be unique and required)'
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Hashed password'
      },
      firebase_uid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Firebase UID for authentication'
      },
      role: {
        type: DataTypes.ENUM('user', 'admin', 'responder'),
        defaultValue: 'user',
        comment: 'User role (e.g., user, admin, responder)'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: 'is_active',
        defaultValue: true,
        comment: 'Whether the user account is active'
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeCreate: hashPassword,
        beforeUpdate: hashPassword
      },
      defaultScope: {
        attributes: {
          exclude: ['password', 'firebase_uid']
        }
      },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] }
        }
      }
    }
  );

  return User;
};
