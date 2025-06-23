const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class File extends Model {}

  File.init(
    {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Primary key',
    },
    original_name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Original name of the uploaded file',
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'MIME type of the file',
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'File size in bytes',
    },
    storage_path: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Path where the file is stored',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'ID of the user who uploaded the file',
    },
    message_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'chat_messages',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'ID of the message this file is attached to (if any)',
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Width of the image/video (if applicable)',
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Height of the image/video (if applicable)',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in seconds (for audio/video files)',
    },
    thumbnail_path: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Path to the thumbnail (for images/videos)',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional metadata about the file',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When the file was uploaded',
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When the file was last updated',
    },
  },
  {
    sequelize,
    modelName: 'File',
    tableName: 'files',
    timestamps: false, // We're using custom timestamp fields
    underscored: true,
    hooks: {
      beforeCreate: (file) => {
        file.created_at = new Date();
        file.updated_at = new Date();
      },
      beforeUpdate: (file) => {
        file.updated_at = new Date();
      },
    },
    indexes: [
      {
        fields: ['user_id'],
        name: 'idx_files_user_id',
      },
      {
        fields: ['message_id'],
        name: 'idx_files_message_id',
      },
      {
        fields: ['created_at'],
        name: 'idx_files_created_at',
      },
    ],
    }
  );

  return File;
};
