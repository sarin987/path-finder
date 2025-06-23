const { sequelize } = require('../config/database');
const User = require('./User');
const Message = require('./Message');
const File = require('./File');
const Conversation = require('./Conversation');
const ConversationParticipant = require('./ConversationParticipant');
const ChatMessage = require('./chatMessage.model');

// Initialize models with sequelize instance
const UserModel = User(sequelize);
const MessageModel = Message(sequelize);
const FileModel = File(sequelize);
const ConversationModel = Conversation(sequelize);
const ConversationParticipantModel = ConversationParticipant(sequelize);
const ChatMessageModel = ChatMessage(sequelize);

// Create models object
const models = {
  User: UserModel,
  Message: MessageModel,
  File: FileModel,
  Conversation: ConversationModel,
  ConversationParticipant: ConversationParticipantModel,
  ChatMessage: ChatMessageModel
};

// Define associations
const defineAssociations = () => {
  try {
    console.log('🔗 Defining model associations...');
    
    // User associations
    UserModel.hasMany(MessageModel, { foreignKey: 'sender_id', as: 'sentMessages' });
    UserModel.hasMany(MessageModel, { foreignKey: 'receiver_id', as: 'receivedMessages' });
    UserModel.hasMany(FileModel, { foreignKey: 'user_id', as: 'files' });
    UserModel.hasMany(ConversationParticipantModel, { foreignKey: 'user_id', as: 'conversationParticipants' });
    UserModel.hasMany(ChatMessageModel, { foreignKey: 'sender_id', as: 'sentChatMessages' });

    // Message associations
    MessageModel.belongsTo(UserModel, { foreignKey: 'sender_id', as: 'sender' });
    MessageModel.belongsTo(UserModel, { foreignKey: 'receiver_id', as: 'receiver' });
    MessageModel.belongsTo(ConversationModel, { foreignKey: 'conversation_id', as: 'conversation' });
    MessageModel.hasMany(FileModel, { foreignKey: 'message_id', as: 'attachments' });

    // File associations
    FileModel.belongsTo(UserModel, { foreignKey: 'user_id', as: 'user' });
    FileModel.belongsTo(MessageModel, { foreignKey: 'message_id', as: 'message' });

    // Conversation associations
    ConversationModel.hasMany(MessageModel, { foreignKey: 'conversation_id', as: 'messages' });
    ConversationModel.hasMany(ConversationParticipantModel, { 
      foreignKey: 'conversation_id', 
      as: 'participants' 
    });
    ConversationModel.belongsToMany(UserModel, {
      through: ConversationParticipantModel,
      foreignKey: 'conversation_id',
      otherKey: 'user_id',
      as: 'users'
    });

    // ConversationParticipant associations
    ConversationParticipantModel.belongsTo(ConversationModel, { 
      foreignKey: 'conversation_id', 
      as: 'conversation' 
    });
    ConversationParticipantModel.belongsTo(UserModel, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });

    // ChatMessage associations
    ChatMessageModel.belongsTo(UserModel, { 
      foreignKey: 'sender_id', 
      as: 'sender' 
    });
    ChatMessageModel.belongsTo(UserModel, { 
      foreignKey: 'receiver_id', 
      as: 'receiver' 
    });

    console.log('✅ Model associations defined successfully');
  } catch (error) {
    console.error('❌ Error defining model associations:', error);
    throw error;
  }
};

// Sync models with database
const syncModels = async () => {
  try {
    console.log('🔄 Syncing database...');
    
    // Define associations first
    defineAssociations();
    
    // Then sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

// Initialize function to be called from server.js
const init = async () => {
  try {
    await syncModels();
    console.log('🚀 Database initialization complete');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};

// Export models, sequelize instance, and initialization function
module.exports = {
  sequelize,
  ...models,
  syncModels,
  init,
  defineAssociations
};
