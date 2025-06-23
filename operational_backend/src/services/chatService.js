const { Op } = require('sequelize');
const { Message, User } = require('../models');

class ChatService {
  /**
   * Send a new message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created message
   */
  static async sendMessage(messageData) {
    try {
      const message = await Message.create({
        ...messageData,
        status: Message.STATUS.SENT
      });

      // Mark as delivered
      await this.markAsDelivered(message.id);

      // Get the full message with sender info
      return this.getMessageById(message.id);
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Get message by ID
   * @param {number} messageId - Message ID
   * @returns {Promise<Object>} Message with sender and receiver info
   */
  static async getMessageById(messageId) {
    return Message.findByPk(messageId, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'email'] },
        {
          model: Message,
          as: 'parentMessage',
          include: [
            { model: User, as: 'sender', attributes: ['id', 'name', 'email'] }
          ]
        }
      ]
    });
  }

  /**
   * Get messages for a room with pagination
   * @param {string} roomId - Room ID
   * @param {number} [page=1] - Page number
   * @param {number} [limit=50] - Messages per page
   * @returns {Promise<Object>} Paginated messages
   */
  static async getRoomMessages(roomId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const { count, rows: messages } = await Message.findAndCountAll({
      where: { 
        roomId,
        isDeleted: false 
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'email'] },
        {
          model: Message,
          as: 'parentMessage',
          include: [
            { model: User, as: 'sender', attributes: ['id', 'name', 'email'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit
      }
    };
  }

  /**
   * Mark messages as read
   * @param {Array<number>} messageIds - Array of message IDs
   * @param {number} userId - ID of the user who read the messages
   * @returns {Promise<Array<number>>} Updated message IDs
   */
  static async markAsRead(messageIds, userId) {
    const [updatedCount] = await Message.update(
      { 
        status: Message.STATUS.READ,
        readAt: new Date() 
      },
      {
        where: { 
          id: messageIds,
          receiverId: userId,
          status: { [Op.in]: [Message.STATUS.SENT, Message.STATUS.DELIVERED] }
        },
        returning: true
      }
    );

    return updatedCount;
  }

  /**
   * Mark messages as delivered
   * @param {Array<number>} messageIds - Array of message IDs
   * @returns {Promise<number>} Number of updated messages
   */
  static async markAsDelivered(messageIds) {
    if (!Array.isArray(messageIds)) {
      messageIds = [messageIds];
    }

    const [updatedCount] = await Message.update(
      { 
        status: Message.STATUS.DELIVERED,
        deliveredAt: new Date() 
      },
      {
        where: { 
          id: messageIds,
          status: Message.STATUS.SENT
        }
      }
    );

    return updatedCount;
  }

  /**
   * Add or update a reaction to a message
   * @param {number} messageId - Message ID
   * @param {number} userId - User ID
   * @param {string} reaction - Reaction emoji or text
   * @returns {Promise<Object>} Updated message
   */
  static async addReaction(messageId, userId, reaction) {
    const message = await Message.findByPk(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const reactions = message.reactions || {};
    
    // Toggle reaction - remove if already exists, otherwise add/update
    if (reactions[userId] === reaction) {
      delete reactions[userId];
    } else {
      reactions[userId] = reaction;
    }

    await message.update({ reactions });
    return this.getMessageById(messageId);
  }

  /**
   * Delete a message (soft delete)
   * @param {number} messageId - Message ID
   * @param {number} userId - User ID requesting deletion
   * @param {boolean} [forEveryone=false] - Whether to delete for everyone
   * @returns {Promise<boolean>} Success status
   */
  static async deleteMessage(messageId, userId, forEveryone = false) {
    const message = await Message.findByPk(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    if (forEveryone && message.senderId === userId) {
      // Delete for everyone (only sender can do this)
      await message.update({ 
        isDeleted: true,
        deletedFor: []
      });
    } else {
      // Delete only for the current user
      const deletedFor = [...new Set([...(message.deletedFor || []), userId])];
      await message.update({ deletedFor });
    }

    return true;
  }

  /**
   * Edit a message
   * @param {number} messageId - Message ID
   * @param {number} userId - User ID
   * @param {string} newContent - New message content
   * @returns {Promise<Object>} Updated message
   */
  static async editMessage(messageId, userId, newContent) {
    const message = await Message.findByPk(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Not authorized to edit this message');
    }

    await message.update({
      message: newContent,
      isEdited: true,
      metadata: {
        ...(message.metadata || {}),
        editHistory: [
          ...(message.metadata?.editHistory || []),
          {
            content: message.message,
            editedAt: new Date()
          }
        ]
      }
    });

    return this.getMessageById(messageId);
  }

  /**
   * Get unread message count for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Count of unread messages
   */
  static async getUnreadCount(userId) {
    return Message.count({
      where: {
        receiverId: userId,
        status: { [Op.in]: [Message.STATUS.SENT, Message.STATUS.DELIVERED] },
        isDeleted: false
      }
    });
  }

  /**
   * Get recent conversations for a user
   * @param {number} userId - User ID
   * @param {number} [limit=20] - Number of conversations to return
   * @returns {Promise<Array>} List of recent conversations
   */
  static async getRecentConversations(userId, limit = 20) {
    // Get the most recent message from each conversation
    const recentMessages = await Message.findAll({
      attributes: [
        'roomId',
        [sequelize.fn('MAX', sequelize.col('created_at')), 'latest_message_at']
      ],
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ],
        isDeleted: false
      },
      group: ['roomId'],
      order: [[sequelize.literal('latest_message_at'), 'DESC']],
      limit,
      raw: true
    });

    // Get full message details for each conversation
    const conversations = await Promise.all(
      recentMessages.map(async ({ roomId }) => {
        // Get the most recent message in the conversation
        const lastMessage = await Message.findOne({
          where: {
            roomId,
            isDeleted: false,
            [Op.or]: [
              { senderId: userId },
              { receiverId: userId }
            ]
          },
          include: [
            { model: User, as: 'sender', attributes: ['id', 'name', 'email'] },
            { model: User, as: 'receiver', attributes: ['id', 'name', 'email'] }
          ],
          order: [['createdAt', 'DESC']]
        });

        if (!lastMessage) return null;

        // Get the other user in the conversation
        const otherUser = lastMessage.senderId === userId 
          ? lastMessage.receiver 
          : lastMessage.sender;

        // Count unread messages
        const unreadCount = await Message.count({
          where: {
            roomId,
            receiverId: userId,
            status: { [Op.in]: [Message.STATUS.SENT, Message.STATUS.DELIVERED] },
            isDeleted: false
          }
        });

        return {
          roomId,
          user: otherUser,
          lastMessage,
          unreadCount,
          updatedAt: lastMessage.createdAt
        };
      })
    );

    return conversations.filter(Boolean);
  }
}

module.exports = ChatService;
