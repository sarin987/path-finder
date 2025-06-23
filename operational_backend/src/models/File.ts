import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
// Using require to avoid circular dependencies
const ChatMessage = require('./ChatMessage').default;
const User = require('./User').default;

export interface FileAttributes {
  id: number;
  original_name: string;
  storage_path: string;
  mime_type: string;
  size: number;
  type: 'image' | 'audio' | 'video' | 'file';
  chat_message_id: number;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface FileCreationAttributes extends Optional<FileAttributes, 'id' | 'created_at' | 'updated_at'> {}

class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
  public id!: number;
  public original_name!: string;
  public storage_path!: string;
  public mime_type!: string;
  public size!: number;
  public type!: 'image' | 'audio' | 'video' | 'file';
  public chat_message_id!: number;
  public created_by!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly chatMessage?: typeof ChatMessage;
  public readonly creator?: typeof User;
}

File.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    original_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    storage_path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('image', 'audio', 'video', 'file'),
      allowNull: false,
    },
    chat_message_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chat_messages',
        key: 'id',
      },
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'files',
    timestamps: true,
    underscored: true,
  }
);

// Associations
export const associate = (models: any) => {
  File.belongsTo(models.ChatMessage, {
    foreignKey: 'chat_message_id',
    as: 'chatMessage',
  });

  File.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator',
  });
};

export { File };
