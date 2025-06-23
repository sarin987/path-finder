const { sequelize, Sequelize } = require('../config/database');
const User = require('./User');
const SOSRequest = require('./SOSRequest');
const ChatMessage = require('./ChatMessage');
const RoleLocation = require('./RoleLocation');

const db = {
  sequelize,
  Sequelize,
  User,
  SOSRequest,
  ChatMessage,
  RoleLocation
};

// Set up model associations
function setupAssociations() {
  // SOSRequest belongs to a user
  SOSRequest.belongsTo(db.User, { foreignKey: 'user_id' });

  // ChatMessage associations
  ChatMessage.belongsTo(db.User, { as: 'sender', foreignKey: 'sender_id' });
  ChatMessage.belongsTo(db.User, { as: 'receiver', foreignKey: 'receiver_id' });
  
  // Add associations for quick access from User model
  User.hasMany(ChatMessage, { as: 'sentMessages', foreignKey: 'sender_id' });
  User.hasMany(ChatMessage, { as: 'receivedMessages', foreignKey: 'receiver_id' });
  User.hasMany(SOSRequest, { foreignKey: 'user_id' });

  // RoleLocation belongs to a user
  RoleLocation.belongsTo(db.User, { foreignKey: 'user_id' });
  User.hasOne(RoleLocation, { foreignKey: 'user_id' });

  console.log('✅ Model associations set up successfully');
}

// Initialize database connection and models
async function init() {
  try {
    // Test the database connection
    const connected = await require('../config/database').testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }
    
    // Setup model associations
    setupAssociations();
    
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

module.exports = {
  init,
  ...db
};
