import { Model, DataTypes, Optional, Sequelize, ModelAttributes, InitOptions } from 'sequelize';
import sequelize from '../config/database';

// Import models after they are defined to avoid circular dependencies
import { IUserAttributes } from './User';

export interface IChatMessageAttributes {
  id: number;
  room_id: string;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}

export type IChatMessageCreationAttributes = Optional<IChatMessageAttributes, 'id' | 'is_read' | 'created_at' | 'updated_at'>;

class ChatMessage extends Model<IChatMessageAttributes, IChatMessageCreationAttributes> implements IChatMessageAttributes {
  public id!: number;
  public room_id!: string;
  public sender_id!: number;
  public receiver_id!: number;
  public message!: string;
  public is_read!: boolean;
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
    room_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Combination of user1_id and user2_id sorted and joined with _',
    },
    sender_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    receiver_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  };

  // Model options
  static getOptions(sequelizeInstance: Sequelize): InitOptions {
    return {
      tableName: 'chat_messages',
      sequelize: sequelizeInstance,
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['room_id'],
        },
        {
          fields: ['sender_id'],
        },
        {
          fields: ['receiver_id'],
        },
      ],
    };
  }

  // Initialize the model
  static initialize(sequelizeInstance: Sequelize): typeof ChatMessage {
    ChatMessage.init(ChatMessage.attributes, ChatMessage.getOptions(sequelizeInstance));
    return ChatMessage;
  }

  // Set up associations
  static associate(models: any) {
    ChatMessage.belongsTo(models.User, {
      foreignKey: 'sender_id',
      as: 'sender',
    });

    ChatMessage.belongsTo(models.User, {
      foreignKey: 'receiver_id',
      as: 'receiver',
    });
  }
}

ChatMessage.initialize(sequelize);

export default ChatMessage;
