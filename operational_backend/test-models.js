import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Import db after environment is set up
import db from './models/index.js';

async function testModels() {
  try {
    console.log('🔍 Testing database models...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync all models
    await db.sequelize.sync({ force: false, alter: true });
    console.log('✅ Database synchronized');
    
    // Test creating a user (assuming User model exists)
    console.log('\n🔄 Testing User model...');
    let user1, user2;
    
    try {
      user1 = await db.User.create({
        name: 'Test User 1',
        email: 'test1@example.com',
        password: 'password123',
        role: 'user'
      });
      
      user2 = await db.User.create({
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'password123',
        role: 'user'
      });
      
      console.log('✅ Created test users');
    } catch (error) {
      console.warn('⚠️ Could not create test users, they may already exist');
      // Try to find existing users
      user1 = await db.User.findOne({ where: { email: 'test1@example.com' } });
      user2 = await db.User.findOne({ where: { email: 'test2@example.com' } });
    }
    
    // Test creating a conversation
    console.log('\n🔄 Testing Conversation model...');
    const conversation = await db.Conversation.create({
      service_type: 'emergency',
      participant_ids: [user1.id, user2.id],
      is_group: false,
      created_by: user1.id,
      metadata: { type: 'direct_message' }
    });
    
    console.log('✅ Created conversation:', {
      id: conversation.id,
      participantIds: conversation.participant_ids,
      serviceType: conversation.service_type
    });
    
    // Test creating a message
    console.log('\n🔄 Testing ChatMessage model...');
    const message = await db.ChatMessage.create({
      room_id: `room_${conversation.id}`,
      sender_id: user1.id,
      receiver_id: user2.id,
      conversation_id: conversation.id,
      message: 'Test message',
      message_type: 'text',
      content: { text: 'This is a test message' },
      status: 'sent'
    });
    
    console.log('✅ Created message:', {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      message: message.message
    });
    
    // Test updating conversation with last message
    console.log('\n🔄 Updating conversation with last message...');
    await conversation.update({
      last_message_id: message.id,
      last_message_at: new Date()
    });
    
    console.log('✅ Updated conversation with last message');
    
    // Test querying conversation with messages
    console.log('\n🔄 Fetching conversation with messages...');
    const conversationWithMessages = await db.Conversation.findByPk(conversation.id, {
      include: [
        { 
          model: db.ChatMessage, 
          as: 'messages',
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });
    
    console.log('✅ Fetched conversation with messages:', {
      id: conversationWithMessages.id,
      messageCount: conversationWithMessages.messages?.length || 0,
      firstMessage: conversationWithMessages.messages?.[0]?.message
    });
    
    console.log('\n✅ All model tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing models:', error);
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
testModels();
