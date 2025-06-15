const { Op } = require('sequelize');
const { User, Message } = require('../models');
const ChatService = require('../services/chatService');

class ChatController {
  /**
   * Get messages for a room with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getRoomMessages(req, res) {
    try {
      const { roomId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      
      const result = await ChatService.getRoomMessages(roomId, page, limit);
      
      res.json({
        success: true,
        data: result.messages,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting room messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages'
      });
    }
  }

  /**
   * Get recent conversations for the current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getRecentConversations(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;
      
      const conversations = await ChatService.getRecentConversations(userId, limit);
      
      res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      console.error('Error getting recent conversations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch conversations'
      });
    }
  }

  /**
   * Mark messages as read
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async markAsRead(req, res) {
    try {
      const { messageIds } = req.body;
      const userId = req.user.id;
      
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'messageIds must be a non-empty array'
        });
      }
      
      const updatedCount = await ChatService.markAsRead(messageIds, userId);
      
      res.json({
        success: true,
        updatedCount
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
   * Add or update a reaction to a message
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async addReaction(req, res) {
    try {
      const { messageId } = req.params;
      const { reaction } = req.body;
      const userId = req.user.id;
      
      if (!reaction) {
        return res.status(400).json({
          success: false,
          error: 'Reaction is required'
        });
      }
      
      const message = await ChatService.addReaction(messageId, userId, reaction);
      
      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add reaction'
      });
    }
  }

  /**
   * Edit a message
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async editMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;
      
      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Content is required'
        });
      }
      
      const message = await ChatService.editMessage(messageId, userId, content);
      
      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Error editing message:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to edit message'
      });
    }
  }

  /**
   * Delete a message
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { forEveryone } = req.body;
      const userId = req.user.id;
      
      await ChatService.deleteMessage(messageId, userId, forEveryone);
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete message'
      });
    }
  }

  /**
   * Search messages
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async searchMessages(req, res) {
    try {
      const { query, roomId } = req.query;
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }
      
      const where = {
        [Op.or]: [
          { message: { [Op.like]: `%${query}%` } },
          { '$sender.name$': { [Op.like]: `%${query}%` } }
        ],
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ],
        isDeleted: false,
        ...(roomId && { roomId })
      };
      
      const { count, rows: messages } = await Message.findAndCountAll({
        where,
        include: [
          { model: User, as: 'sender', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'receiver', attributes: ['id', 'name', 'email'] }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit
      });
      
      res.json({
        success: true,
        data: messages,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search messages'
      });
    }
  }

  /**
   * Get unread message count
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await ChatService.getUnreadCount(userId);
      
      res.json({
        success: true,
        count
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get unread count'
      });
    }
  }
}

module.exports = ChatController;
