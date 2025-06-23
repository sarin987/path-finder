const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class ChatMessage extends Model {}

  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sender_role: {
      type: DataTypes.ENUM('user', 'responder'),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  };

  const options = {
    sequelize,
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
    timestamps: false, // Using custom timestamp field
  };

  ChatMessage.init(schema, options);
  return ChatMessage;
};
