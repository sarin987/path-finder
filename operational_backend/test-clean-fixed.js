import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Sequelize, DataTypes } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Database configuration
const dbConfig = {
  database: process.env.DB_NAME || 'safety_emergency_db',
  username: process.env.DB_USER || 'sarin_raj',
  password: process.env.DB_PASS || 'Sarinraj@2025!',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    // Prevent Sequelize from using NULL for timestamps
    timestampsWithDefaults: true,
  },
  dialectOptions: {
    // Handle invalid datetime values
    dateStrings: true,
    typeCast: true,
  },
};

// Initialize Sequelize with proper timezone handling
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    ...dbConfig,
    timezone: '+05:30', // IST timezone
  }
);

// Define models with explicit timestamp handling
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
    type: DataTypes.STRING,
    defaultValue: 'user',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  // Add default values for timestamps
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  // Prevent Sequelize from setting default values that might be invalid
  hooks: {
    beforeCreate: (user) => {
      user.created_at = new Date();
      user.updated_at = new Date();
    },
    beforeUpdate: (user) => {
      user.updated_at = new Date();
    },
  },
});

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  service_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  participant_ids: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('participant_ids');
      return rawValue || [];
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('participant_ids', [...new Set(value)]);
      } else {
        this.setDataValue('participant_ids', []);
      }
    }
  },
  is_group: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  last_message_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('metadata');
      return rawValue || {};
    }
  },
}, {
  tableName: 'conversations',
  timestamps: true,
  underscored: true,
  // Add default values for timestamps
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
});

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  room_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  receiver_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  conversation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  message_type: {
    type: DataTypes.ENUM('text', 'image', 'location', 'file'),
    defaultValue: 'text',
  },
  content: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed'),
    defaultValue: 'sent',
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reactions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    get() {
      const rawValue = this.getDataValue('reactions');
      return rawValue || {};
    }
  },
  is_edited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deleted_for: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('deleted_for');
      return rawValue || [];
    }
  },
  parent_message_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'chat_messages',
  timestamps: true,
  underscored: true,
  // Add default values for timestamps
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
});

// Set up associations
User.hasMany(ChatMessage, { foreignKey: 'sender_id', as: 'sentMessages' });
User.hasMany(ChatMessage, { foreignKey: 'receiver_id', as: 'receivedMessages' });
User.hasMany(Conversation, { foreignKey: 'created_by', as: 'conversationsCreated' });

Conversation.hasMany(ChatMessage, { foreignKey: 'conversation_id', as: 'messages' });
Conversation.belongsTo(ChatMessage, { foreignKey: 'last_message_id', as: 'lastMessage' });

ChatMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
ChatMessage.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });
ChatMessage.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
ChatMessage.belongsTo(ChatMessage, { foreignKey: 'parent_message_id', as: 'parentMessage' });

// Drop and recreate tables if they exist
async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    // Drop tables in the correct order to avoid foreign key constraints
    await ChatMessage.drop({ cascade: true }).catch(() => {});
    await Conversation.drop({ cascade: true }).catch(() => {});
    await User.drop({ cascade: true }).catch(() => {});
    
    console.log('✅ Database reset complete');
    return true;
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    return false;
  }
}

// Test function
async function testDatabase() {
  try {
    // Authenticate with the database
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Reset database for a clean slate
    await resetDatabase();
    
    // Sync all models
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized');
    
    // Create test users
    const user1 = await User.create({
      name: 'Test User 1',
      email: 'test1@example.com',
      password: 'password123',
      role: 'user',
    });
    
    const user2 = await User.create({
      name: 'Test User 2',
      email: 'test2@example.com',
      password: 'password123',
      role: 'user',
    });
    
    console.log('✅ Test users created');
    
    // Create a conversation
    const conversation = await Conversation.create({
      service_type: 'emergency',
      participant_ids: [user1.id, user2.id],
      is_group: false,
      created_by: user1.id,
      metadata: { type: 'direct_message' },
    });
    
    console.log('✅ Conversation created:', {
      id: conversation.id,
      participantIds: conversation.participant_ids,
    });
    
    // Create a message
    const message = await ChatMessage.create({
      room_id: `room_${conversation.id}`,
      sender_id: user1.id,
      receiver_id: user2.id,
      conversation_id: conversation.id,
      message: 'Hello, this is a test message',
      message_type: 'text',
      content: { text: 'Hello, this is a test message' },
      status: 'sent',
    });
    
    console.log('✅ Message created:', {
      id: message.id,
      message: message.message,
    });
    
    // Update conversation with last message
    await conversation.update({
      last_message_id: message.id,
    });
    
    console.log('✅ Conversation updated with last message');
    
    // Query the data
    const testConversation = await Conversation.findByPk(conversation.id, {
      include: [
        { model: ChatMessage, as: 'messages' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
    });
    
    console.log('\n📊 Test Results:', {
      conversation: {
        id: testConversation.id,
        serviceType: testConversation.service_type,
        messageCount: testConversation.messages?.length || 0,
        creator: testConversation.creator ? {
          id: testConversation.creator.id,
          name: testConversation.creator.name,
        } : null,
      },
    });
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during database test:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the test
testDatabase();
