import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Import models after environment is set up
import db from './models/index.js';

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync models
    console.log('🔄 Syncing database...');
    await db.sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
    
    // Test creating a user
    console.log('\n🔄 Testing User model...');
    const [user, created] = await db.User.findOrCreate({
      where: { email: 'test@example.com' },
      defaults: {
        name: 'Test User',
        password: 'password123',
        role: 'user'
      }
    });
    
    console.log(created ? '✅ Created test user' : 'ℹ️ Test user already exists', {
      id: user.id,
      email: user.email,
      name: user.name
    });
    
    // Test creating a conversation
    console.log('\n🔄 Testing Conversation model...');
    const conversation = await db.Conversation.create({
      service_type: 'emergency',
      participant_ids: [user.id],
      is_group: false,
      created_by: user.id,
      metadata: { type: 'direct_message' }
    });
    
    console.log('✅ Created conversation:', {
      id: conversation.id,
      service_type: conversation.service_type,
      participant_ids: conversation.participant_ids
    });
    
    // Test creating a message
    console.log('\n🔄 Testing ChatMessage model...');
    const message = await db.ChatMessage.create({
      room_id: `room_${conversation.id}`,
      sender_id: user.id,
      receiver_id: user.id, // For testing, we'll use the same user
      conversation_id: conversation.id,
      message: 'Hello, this is a test message',
      message_type: 'text',
      content: { text: 'Hello, this is a test message' },
      status: 'sent'
    });
    
    console.log('✅ Created message:', {
      id: message.id,
      conversation_id: message.conversation_id,
      message: message.message
    });
    
    // Test querying the data
    console.log('\n🔍 Querying test data...');
    const testUser = await db.User.findOne({
      where: { email: 'test@example.com' },
      include: [
        {
          model: db.Conversation,
          as: 'conversationsCreated',
          include: [
            {
              model: db.ChatMessage,
              as: 'messages'
            }
          ]
        }
      ]
    });
    
    console.log('\n📊 Test Results:', {
      user: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        conversationCount: testUser.conversationsCreated?.length || 0
      },
      firstConversation: testUser.conversationsCreated?.[0] ? {
        id: testUser.conversationsCreated[0].id,
        messageCount: testUser.conversationsCreated[0].messages?.length || 0
      } : 'No conversations found'
    });
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during database test:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    if (db.sequelize) {
      await db.sequelize.close();
      console.log('\n🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the test
testDatabase();
