// Socket.IO Chat Events
const chatService = require('./services/chatService');

function registerChatHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('join_chat', ({ conversationId }) => {
      socket.join(`chat_${conversationId}`);
    });

    socket.on('leave_chat', ({ conversationId }) => {
      socket.leave(`chat_${conversationId}`);
    });

    socket.on('chat_message', async (data) => {
      const { conversationId, senderId, content } = data;
      const message = await chatService.createMessage(conversationId, senderId, content);
      io.to(`chat_${conversationId}`).emit('chat_message', message);
    });

    socket.on('chat_read', async (data) => {
      const { conversationId, userId } = data;
      await chatService.markMessagesAsRead(conversationId, userId);
      io.to(`chat_${conversationId}`).emit('chat_read', { conversationId, userId });
    });
  });
}

module.exports = registerChatHandlers;
