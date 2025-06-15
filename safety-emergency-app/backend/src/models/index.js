const { sequelize } = require('../config/database');
const User = require('./User');
const Message = require('./Message');

// Initialize models
const models = {
  User,
  Message,
  // Add other models here
};

// Define associations
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// Call associate on models if it exists
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// Sync models with database
async function syncModels() {
  try {
    if (process.env.NODE_ENV === 'development' || process.env.FORCE_SYNC === 'true') {
      await sequelize.sync({ force: process.env.FORCE_SYNC === 'true' });
      console.log('✅ Database synced');
    } else {
      console.log('ℹ️  Database sync skipped in production');
    }
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
}

// Export models and sync function
module.exports = {
  sequelize,
  ...models,
  syncModels,
};
