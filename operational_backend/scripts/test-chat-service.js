require('dotenv').config();
const { admin, FirebaseChatService, FirebaseStorageService } = require('../src/services/firebase');

async function testChatService() {
  try {
    console.log('Starting Firebase Chat Service test...');
    
    // Test user IDs
    const user1 = 'test-user-1';
    const user2 = 'test-responder-1';
    
    // Create test users in Firestore if they don't exist
    const usersRef = admin.firestore().collection('users');
    await usersRef.doc(user1).set({
      name: 'Test User',
      role: 'user',
      avatar: 'https://example.com/avatar1.jpg',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    await usersRef.doc(user2).set({
      name: 'Test Responder',
      role: 'responder',
      avatar: 'https://example.com/avatar2.jpg',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('Test users created/updated in Firestore');
    
    // Test 1: Create or get conversation
    console.log('\n--- Test 1: Create or get conversation ---');
    const participantDetails = {
      [user1]: { name: 'Test User', role: 'user', avatar: 'https://example.com/avatar1.jpg' },
      [user2]: { name: 'Test Responder', role: 'responder', avatar: 'https://example.com/avatar2.jpg' }
    };
    
    const conversation = await FirebaseChatService.getOrCreateConversation(
      [user1, user2],
      participantDetails
    );
    
    console.log('Conversation created/retrieved:', conversation.id);
    
    // Test 2: Send a text message
    console.log('\n--- Test 2: Send text message ---');
    const textMessage = await FirebaseChatService.sendMessage(conversation.id, {
      senderId: user1,
      senderRole: 'user',
      content: 'Hello, this is a test message!'
    });
    
    console.log('Text message sent:', {
      id: textMessage.id,
      content: textMessage.content,
      status: textMessage.status
    });
    
    // Test 3: Send a location message
    console.log('\n--- Test 3: Send location message ---');
    const locationMessage = await FirebaseChatService.sendMessage(conversation.id, {
      senderId: user2,
      senderRole: 'responder',
      location: {
        lat: 12.9716,
        lng: 77.5946,
        name: 'Bangalore, India'
      }
    });
    
    console.log('Location message sent:', {
      id: locationMessage.id,
      location: locationMessage.location,
      status: locationMessage.status
    });
    
    // Test 4: Mark messages as read
    console.log('\n--- Test 4: Mark messages as read ---');
    await FirebaseChatService.markAsRead(conversation.id, user2, [textMessage.id, locationMessage.id]);
    console.log(`Marked messages as read for user ${user2}`);
    
    // Test 5: Get conversation messages
    console.log('\n--- Test 5: Get conversation messages ---');
    const messages = await FirebaseChatService.getMessages(conversation.id, { limit: 10 });
    console.log(`Retrieved ${messages.length} messages:`);
    messages.forEach((msg, index) => {
      console.log(`[${index + 1}] ${msg.senderId}: ${msg.content || JSON.stringify(msg.location) || 'Media message'}`);
    });
    
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testChatService();
