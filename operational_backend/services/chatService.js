// Chat Service
const { ChatMessage, Conversation } = require('../models');

module.exports = {
  async getMessages(conversationId) {
    return ChatMessage.findAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']]
    });
  },

  async createMessage(conversationId, senderId, content) {
    return ChatMessage.create({ conversationId, senderId, content, read: false });
  },

  async markMessagesAsRead(conversationId, userId) {
    await ChatMessage.update(
      { read: true },
      { where: { conversationId, senderId: { $ne: userId } } }
    );
  }
};
