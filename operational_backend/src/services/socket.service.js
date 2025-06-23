const socketIO = require('socket.io');
const ChatMessage = require('../models/chatMessage.model');

class SocketService {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: '*', // In production, replace with specific origins
        methods: ['GET', 'POST']
      }
    });
    this.users = new Map(); // userId -> socketId
    this.initializeEvents();
  }

  initializeEvents() {
    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // User joins with their userId and role
      socket.on('join', ({ userId, role }) => {
        this.users.set(userId, socket.id);
        socket.join(`user_${userId}`);
        console.log(`User ${userId} (${role}) connected`);
      });

      // Handle new message
      socket.on('send_message', async (data) => {
        try {
          const { senderId, receiverId, senderRole, message } = data;
          
          // Save to database
          const chatMessage = await ChatMessage.create({
            sender_id: senderId,
            receiver_id: receiverId,
            sender_role: senderRole,
            message,
            is_read: false,
          });

          // Emit to receiver
          const receiverSocketId = this.users.get(receiverId);
          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit('receive_message', {
              ...chatMessage.dataValues,
              timestamp: chatMessage.timestamp.toISOString(),
            });
          }

          // Send delivery confirmation
          socket.emit('message_delivered', {
            messageId: chatMessage.id,
            timestamp: chatMessage.timestamp.toISOString(),
          });

        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicator
      socket.on('typing', ({ senderId, receiverId, isTyping }) => {
        const receiverSocketId = this.users.get(receiverId);
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('user_typing', { 
            senderId, 
            isTyping 
          });
        }
      });

      // Handle read receipt
      socket.on('message_read', async ({ messageId, readerId }) => {
        try {
          await ChatMessage.update(
            { is_read: true },
            { where: { id: messageId } }
          );
          // Notify sender that message was read
          const message = await ChatMessage.findByPk(messageId);
          if (message) {
            const senderSocketId = this.users.get(message.sender_id);
            if (senderSocketId) {
              this.io.to(senderSocketId).emit('message_read_confirmation', { 
                messageId,
                readAt: new Date().toISOString() 
              });
            }
          }
        } catch (error) {
          console.error('Error updating read status:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        // Remove user from map
        for (const [userId, socketId] of this.users.entries()) {
          if (socketId === socket.id) {
            this.users.delete(userId);
            console.log(`User ${userId} disconnected`);
            break;
          }
        }
      });
    });
  }

  getIO() {
    return this.io;
  }
}

module.exports = SocketService;
