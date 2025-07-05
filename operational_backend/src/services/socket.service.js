const socketIO = require('socket.io');
const ChatMessage = require('../models/chatMessage.model');

class SocketService {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: (origin, callback) => {
          // Allow WebSocket connections from ngrok in development
          if (process.env.NODE_ENV === 'development' && 
              (origin === 'https://3bf6-2401-4900-881e-1353-d678-d6fc-de47-c356.ngrok-free.app' || 
               origin.endsWith('.ngrok-free.app'))) {
            return callback(null, true);
          }
          
          // Allow localhost and other development origins
          const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://localhost:2222',
            'http://localhost:8082',
            'http://192.168.1.18:5000',
            'http://192.168.14.111:3000',
            ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [])
          ];
          
          if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
          } else {
            console.log('WebSocket CORS blocked for origin:', origin);
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST'],
        credentials: true
      },
      allowEIO3: true // For Socket.IO v2 compatibility if needed
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
