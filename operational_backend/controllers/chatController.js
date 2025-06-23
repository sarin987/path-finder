// Chat Controller
const chatService = require('../services/chatService');

module.exports = {
  async getChatHistory(req, res) {
    const { conversationId } = req.query;
    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
    const messages = await chatService.getMessages(conversationId);
    res.json(messages);
  },

  async sendMessage(req, res) {
    const { conversationId, senderId, content } = req.body;
    if (!conversationId || !senderId || !content) return res.status(400).json({ error: 'Missing fields' });
    const message = await chatService.createMessage(conversationId, senderId, content);
    res.json(message);
  },

  async markAsRead(req, res) {
    const { conversationId, userId } = req.body;
    if (!conversationId || !userId) return res.status(400).json({ error: 'Missing fields' });
    await chatService.markMessagesAsRead(conversationId, userId);
    res.json({ success: true });
  }
};
