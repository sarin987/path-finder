const admin = require('firebase-admin');
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const { v4: uuidv4 } = require('uuid');

class FirebaseChatService {
  /**
   * Create a new conversation between participants
   * @param {Array<string>} participantIds - Array of user IDs in the conversation
   * @param {Object} participantDetails - Map of participantId to user details
   * @returns {Promise<Object>} The created conversation
   */
  static async createConversation(participantIds, participantDetails) {
    try {
      const conversationRef = db.collection('conversations').doc();
      const conversation = {
        id: conversationRef.id,
        participants: [...new Set(participantIds)].sort(), // Ensure unique and sorted
        participantDetails,
        unreadCount: participantIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastMessage: null
      };
      
      await conversationRef.set(conversation);
      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  }

  /**
   * Send a message in a conversation
   * @param {string} conversationId - ID of the conversation
   * @param {Object} message - Message object
   * @param {string} message.senderId - ID of the message sender
   * @param {string} message.senderRole - Role of the sender ('user' or 'responder')
   * @param {string} [message.content] - Text content of the message
   * @param {Object} [message.location] - Location data { lat, lng, name }
   * @param {Object} [message.media] - Media data { url, type, name, size }
   * @returns {Promise<Object>} The sent message with ID
   */
  static async sendMessage(conversationId, message) {
    const batch = db.batch();
    const conversationRef = db.collection('conversations').doc(conversationId);
    const messagesRef = conversationRef.collection('messages');
    const messageId = uuidv4();
    
    // Create message data
    const messageData = {
      id: messageId,
      conversationId,
      senderId: message.senderId,
      senderRole: message.senderRole,
      content: message.content || null,
      location: message.location || null,
      media: message.media || null,
      status: 'sent',
      timestamp: FieldValue.serverTimestamp(),
      readBy: [message.senderId] // Sender has read the message
    };

    // Add message to messages subcollection
    const messageRef = messagesRef.doc(messageId);
    batch.set(messageRef, messageData);

    // Update conversation's last message and unread counts
    const conversationDoc = await conversationRef.get();
    if (!conversationDoc.exists) {
      throw new Error('Conversation not found');
    }

    const conversation = conversationDoc.data();
    const otherParticipants = conversation.participants.filter(id => id !== message.senderId);
    
    // Update conversation
    const updateData = {
      lastMessage: {
        id: messageId,
        content: message.content || (message.media ? 'Media' : 'Location'),
        timestamp: FieldValue.serverTimestamp(),
        senderId: message.senderId,
        senderRole: message.senderRole
      },
      updatedAt: FieldValue.serverTimestamp()
    };
    
    // Increment unread count for other participants
    otherParticipants.forEach(participantId => {
      updateData[`unreadCount.${participantId}`] = FieldValue.increment(1);
    });
    
    batch.update(conversationRef, updateData);
    
    try {
      await batch.commit();
      return { ...messageData, id: messageId };
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Find a conversation by participant IDs
   * @param {Array<string>} participantIds - Array of participant IDs
   * @returns {Promise<Object|null>} The conversation or null if not found
   */
  static async findConversation(participantIds) {
    try {
      const sortedIds = [...new Set(participantIds)].sort();
      const snapshot = await db.collection('conversations')
        .where('participants', '==', sortedIds)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error finding conversation:', error);
      throw new Error('Failed to find conversation');
    }
  }

  /**
   * Get or create a conversation between participants
   * @param {Array<string>} participantIds - Array of participant IDs
   * @param {Object} participantDetails - Map of participantId to user details
   * @returns {Promise<Object>} The existing or newly created conversation
   */
  static async getOrCreateConversation(participantIds, participantDetails) {
    try {
      const existing = await this.findConversation(participantIds);
      if (existing) return existing;
      
      // Verify all participants have details
      const missingDetails = participantIds.filter(id => !participantDetails[id]);
      if (missingDetails.length > 0) {
        throw new Error(`Missing details for participants: ${missingDetails.join(', ')}`);
      }
      
      return this.createConversation(participantIds, participantDetails);
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation with pagination
   * @param {string} conversationId - ID of the conversation
   * @param {Object} options - Pagination options
   * @param {number} [options.limit=20] - Number of messages to fetch
   * @param {string} [options.before] - Message ID to fetch messages before
   * @returns {Promise<Array<Object>>} Array of messages
   */
  static async getMessages(conversationId, { limit = 20, before } = {}) {
    try {
      let query = db.collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(limit);
      
      if (before) {
        const beforeDoc = await db.collection('conversations')
          .doc(conversationId)
          .collection('messages')
          .doc(before)
          .get();
        
        if (beforeDoc.exists) {
          query = query.startAfter(beforeDoc);
        }
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to JavaScript Date
        timestamp: doc.data().timestamp?.toDate()
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      throw new Error('Failed to get messages');
    }
  }

  /**
   * Mark messages as read
   * @param {string} conversationId - ID of the conversation
   * @param {string} userId - ID of the user who read the messages
   * @param {Array<string>} [messageIds] - Specific message IDs to mark as read (optional)
   * @returns {Promise<void>}
   */
  static async markAsRead(conversationId, userId, messageIds = []) {
    const batch = db.batch();
    const conversationRef = db.collection('conversations').doc(conversationId);
    
    if (messageIds.length > 0) {
      // Mark specific messages as read
      messageIds.forEach(messageId => {
        const messageRef = conversationRef.collection('messages').doc(messageId);
        batch.update(messageRef, {
          readBy: FieldValue.arrayUnion(userId)
        });
      });
    }
    
    // Reset unread count for the user
    batch.update(conversationRef, {
      [`unreadCount.${userId}`]: 0,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    try {
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }
}

module.exports = FirebaseChatService;
