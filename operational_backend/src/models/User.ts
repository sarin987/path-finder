import { Model, DataTypes, Optional, Sequelize, ModelStatic, ModelAttributes, InitOptions } from 'sequelize';
const { sequelize, Sequelize: Seq } = require('../config/database');

// Type definitions
export interface IUserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'responder' | 'admin';
  phone?: string;
  address?: string;
  is_active: boolean;
  last_login?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type IUserCreationAttributes = Optional<IUserAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at'>;



class User extends Model<IUserAttributes, IUserCreationAttributes> implements IUserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: 'user' | 'responder' | 'admin';
  public phone?: string;
  public address?: string;
  public is_active!: boolean;
  public last_login?: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Timestamps
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  // Model attributes
  static attributes: ModelAttributes = {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
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
      type: DataTypes.ENUM('user', 'responder', 'admin'),
      defaultValue: 'user',
    },
    phone: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.TEXT,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: {
      type: DataTypes.DATE,
    },
  };

  // Model options
  static getOptions(sequelizeInstance: Sequelize): InitOptions {
    return {
      tableName: 'users',
      sequelize: sequelizeInstance,
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };
  }

  // Initialize the model
  static initialize(sequelizeInstance: Sequelize): typeof User {
    User.init(User.attributes, User.getOptions(sequelizeInstance));
    return User;
  }

  // Set up associations
  static associate(models: any) {
    User.hasMany(models.ChatMessage, {
      foreignKey: 'sender_id',
      as: 'sentMessages',
    });

    User.hasMany(models.ChatMessage, {
      foreignKey: 'receiver_id',
      as: 'receivedMessages',
    });
  }
}

// Export the model class and interfaces
export default User;

// For CommonJS compatibility
const UserModel = User;
module.exports = UserModel;
module.exports.default = UserModel;
module.exports.User = UserModel;
