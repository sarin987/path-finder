const { Op } = require('sequelize');
const { ChatMessage, User, Conversation, ConversationParticipant } = require('../models');

const chatController = {
  // Initialize controller with models
  init() {
    // Initialize any required models or services here
    return this;
  },
  
  // Get messages for a specific room
  async getRoomMessages(req, res) {
    try {
      const { roomId } = req.params;
      const messages = await ChatMessage.findAll({
        where: { room_id: roomId },
        include: [
          { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] },
          { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar'] }
        ],
        order: [['createdAt', 'ASC']]
      });
      res.json(messages);
    } catch (error) {
      console.error('Error fetching room messages:', error);
      res.status(500).json({ message: 'Failed to fetch room messages' });
    }
  },
  
  // Get user's recent conversations
  async getRecentConversations(req, res) {
    try {
      const userId = req.user.id;
      
      const conversations = await Conversation.findAll({
        include: [
          {
            model: ConversationParticipant,
            where: { user_id: userId },
            include: [
              { model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }
            ]
          },
          {
            model: ChatMessage,
            as: 'lastMessage',
            include: [
              { model: User, as: 'sender', attributes: ['id', 'name'] }
            ]
          }
        ],
        order: [[{ model: ChatMessage, as: 'lastMessage' }, 'createdAt', 'DESC']]
      });
      
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching recent conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  },
  
  // Add or update a reaction to a message
  async addReaction(req, res) {
    try {
      const { messageId } = req.params;
      const { reaction } = req.body;
      const userId = req.user.id;
      
      const message = await ChatMessage.findByPk(messageId);
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      // Update or add reaction
      const reactions = message.reactions || {};
      if (reaction) {
        reactions[userId] = reaction;
      } else {
        delete reactions[userId];
      }
      
      message.reactions = reactions;
      await message.save();
      
      res.json({ message: 'Reaction updated', reactions });
    } catch (error) {
      console.error('Error updating reaction:', error);
      res.status(500).json({ message: 'Failed to update reaction' });
    }
  },
  
  // Edit a message
  async editMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;
      
      const message = await ChatMessage.findByPk(messageId);
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      if (message.sender_id !== userId) {
        return res.status(403).json({ message: 'Not authorized to edit this message' });
      }
      
      message.content = content;
      message.is_edited = true;
      await message.save();
      
      res.json(message);
    } catch (error) {
      console.error('Error editing message:', error);
      res.status(500).json({ message: 'Failed to edit message' });
    }
  },
  
  // Delete a message
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;
      
      const message = await ChatMessage.findByPk(messageId);
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      if (message.sender_id !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this message' });
      }
      
      await message.destroy();
      
      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ message: 'Failed to delete message' });
    }
  },
  
  // Search messages
  async searchMessages(req, res) {
    try {
      const { query } = req.query;
      const userId = req.user.id;
      
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const messages = await ChatMessage.findAll({
        where: {
          [Op.or]: [
            { content: { [Op.like]: `%${query}%` } },
            { '$sender.name$': { [Op.like]: `%${query}%` } }
          ],
          [Op.or]: [
            { sender_id: userId },
            { receiver_id: userId }
          ]
        },
        include: [
          { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] },
          { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 50
      });
      
      res.json(messages);
    } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json({ message: 'Failed to search messages' });
    }
  },
  // Get chat history between two users
  async getChatHistory(req, res) {
    try {
      const { userId1, userId2 } = req.params;
      
      const messages = await ChatMessage.findAll({
        where: {
          [Op.or]: [
            {
              sender_id: userId1,
              receiver_id: userId2,
            },
            {
              sender_id: userId2,
              receiver_id: userId1,
            },
          ],
        },
        order: [['timestamp', 'ASC']],
      });

      res.json(messages);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({ message: 'Failed to fetch chat history' });
    }
  },

  // Mark messages as read
  async markAsRead(req, res) {
    try {
      const { messageIds } = req.body;
      
      await ChatMessage.update(
        { is_read: true },
        { 
          where: { 
            id: { [Op.in]: messageIds },
            receiver_id: req.user.id // Ensure user can only mark their own messages as read
          } 
        }
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ message: 'Failed to update message status' });
    }
  },

  // Get unread message count
  async getUnreadCount(req, res) {
    try {
      const count = await ChatMessage.count({
        where: {
          receiver_id: req.user.id,
          is_read: false,
        },
      });

      res.json({ count });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ message: 'Failed to get unread count' });
    }
  },
};

module.exports = chatController;
