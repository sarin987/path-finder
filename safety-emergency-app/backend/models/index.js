import db from '../config/database.js';
import PoliceUser from './PoliceUser.js';
import AmbulanceUser from './AmbulanceUser.js';
import FireUser from './FireUser.js';
import ParentUser from './ParentUser.js';
import SOSRequest from './SOSRequest.js';
import ChatMessage from './ChatMessage.js';
import RoleLocation from './RoleLocation.js';

// Initialize all models
const models = {
  PoliceUser,
  AmbulanceUser,
  FireUser,
  ParentUser,
  SOSRequest,
  ChatMessage,
  RoleLocation,
  db
};

// Set up model associations
function setupAssociations() {
  // SOSRequest belongs to a user
  SOSRequest.belongsTo(models.PoliceUser, { foreignKey: 'user_id' });
  SOSRequest.belongsTo(models.AmbulanceUser, { foreignKey: 'user_id' });
  SOSRequest.belongsTo(models.FireUser, { foreignKey: 'user_id' });
  SOSRequest.belongsTo(models.ParentUser, { foreignKey: 'user_id' });

  // ChatMessage associations
  ChatMessage.belongsTo(models.PoliceUser, { as: 'sender', foreignKey: 'sender_id' });
  ChatMessage.belongsTo(models.PoliceUser, { as: 'receiver', foreignKey: 'receiver_id' });
  ChatMessage.belongsTo(models.AmbulanceUser, { as: 'sender', foreignKey: 'sender_id' });
  ChatMessage.belongsTo(models.AmbulanceUser, { as: 'receiver', foreignKey: 'receiver_id' });
  ChatMessage.belongsTo(models.FireUser, { as: 'sender', foreignKey: 'sender_id' });
  ChatMessage.belongsTo(models.FireUser, { as: 'receiver', foreignKey: 'receiver_id' });
  ChatMessage.belongsTo(models.ParentUser, { as: 'sender', foreignKey: 'sender_id' });
  ChatMessage.belongsTo(models.ParentUser, { as: 'receiver', foreignKey: 'receiver_id' });

  // RoleLocation belongs to a specific role user
  RoleLocation.belongsTo(models.PoliceUser, { foreignKey: 'role_id', constraints: false });
  RoleLocation.belongsTo(models.AmbulanceUser, { foreignKey: 'role_id', constraints: false });
  RoleLocation.belongsTo(models.FireUser, { foreignKey: 'role_id', constraints: false });
  RoleLocation.belongsTo(models.ParentUser, { foreignKey: 'role_id', constraints: false });

  console.log('✅ Model associations set up successfully');
}

// Call the setup function
setupAssociations();

// Export all models
export default models;
