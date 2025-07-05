const { FirebaseChatService, FirebaseStorageService } = require('../services/firebase');
const { User } = require('../models');

class ChatController {
  /**
   * Send a message
   */
  static async sendMessage(req, res) {
    try {
      const { conversationId, recipientId, content, location, media } = req.body;
      const senderId = req.user.id;
      const senderRole = req.user.role;

      // Get or create conversation
      let conversation;
      if (conversationId) {
        // Get existing conversation
        conversation = await FirebaseChatService.findConversation([senderId, recipientId]);
        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
      } else {
        // Create new conversation if no ID provided
        if (!recipientId) {
          return res.status(400).json({ error: 'Recipient ID is required for new conversations' });
        }

        // Get user details for both participants
        const [sender, recipient] = await Promise.all([
          User.findByPk(senderId),
          User.findByPk(recipientId)
        ]);

        if (!sender || !recipient) {
          return res.status(404).json({ error: 'User not found' });
        }

        const participantDetails = {
          [senderId]: {
            name: sender.name,
            role: sender.role,
            avatar: sender.avatar
          },
          [recipientId]: {
            name: recipient.name,
            role: recipient.role,
            avatar: recipient.avatar
          }
        };

        conversation = await FirebaseChatService.getOrCreateConversation(
          [senderId, recipientId],
          participantDetails
        );
      }

      // Handle media upload if present
      let mediaData;
      if (req.file) {
        mediaData = await FirebaseStorageService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          `chat/media/${conversation.id}`
        );
      }

      // Send message
      const message = await FirebaseChatService.sendMessage(conversation.id, {
        senderId,
        senderRole,
        content,
        location,
        media: mediaData
      });

      // Emit socket event for real-time updates
      if (req.io) {
        req.io.to(recipientId).emit('new_message', {
          conversationId: conversation.id,
          message
        });
      }

      res.status(201).json({
        success: true,
        data: {
          conversationId: conversation.id,
          message
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send message'
      });
    }
  }

  /**
   * Get conversation messages
   */
  static async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const { limit = 20, before } = req.query;

      const messages = await FirebaseChatService.getMessages(conversationId, {
        limit: parseInt(limit, 10),
        before
      });

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get messages'
      });
    }
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(req, res) {
    try {
      const { conversationId, messageIds } = req.body;
      const userId = req.user.id;

      await FirebaseChatService.markAsRead(conversationId, userId, messageIds);

      // Emit socket event for real-time updates
      if (req.io) {
        req.io.to(conversationId).emit('messages_read', {
          conversationId,
          userId,
          messageIds
        });
      }

      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark messages as read'
      });
    }
  }

  /**
   * Get user conversations
   */
  static async getConversations(req, res) {
    try {
      const userId = req.user.id;
      const snapshot = await admin
        .firestore()
        .collection('conversations')
        .where('participants', 'array-contains', userId)
        .orderBy('updatedAt', 'desc')
        .get();

      const conversations = [];
      snapshot.forEach(doc => {
        conversations.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to JavaScript Date
          updatedAt: doc.data().updatedAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate()
        });
      });

      res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversations'
      });
    }
  }
}

module.exports = ChatController;
