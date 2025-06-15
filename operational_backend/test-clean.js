import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Sequelize } from 'sequelize';

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
};

// Initialize Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
  }
);

// Define models
const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  role: {
    type: Sequelize.STRING,
    defaultValue: 'user',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

const Conversation = sequelize.define('Conversation', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  service_type: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  participant_ids: {
    type: Sequelize.JSON,
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
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  created_by: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  last_message_id: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  metadata: {
    type: Sequelize.JSON,
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
});

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  room_id: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  sender_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  receiver_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  conversation_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  message: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  message_type: {
    type: Sequelize.ENUM('text', 'image', 'location', 'file'),
    defaultValue: 'text',
  },
  content: {
    type: Sequelize.JSON,
    allowNull: false,
  },
  is_read: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: Sequelize.ENUM('sent', 'delivered', 'read', 'failed'),
    defaultValue: 'sent',
  },
  read_at: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  delivered_at: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  reactions: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: {},
    get() {
      const rawValue = this.getDataValue('reactions');
      return rawValue || {};
    }
  },
  is_edited: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  is_deleted: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  deleted_for: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('deleted_for');
      return rawValue || [];
    }
  },
  parent_message_id: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'chat_messages',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
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

// Test function
async function testDatabase() {
  try {
    // Authenticate with the database
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync all models
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database synchronized');
    
    // Create test user
    const [user1] = await User.findOrCreate({
      where: { email: 'test1@example.com' },
      defaults: {
        name: 'Test User 1',
        password: 'password123',
        role: 'user',
      },
    });
    
    const [user2] = await User.findOrCreate({
      where: { email: 'test2@example.com' },
      defaults: {
        name: 'Test User 2',
        password: 'password123',
        role: 'user',
      },
    });
    
    console.log('✅ Test users created/retrieved');
    
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
