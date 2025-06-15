const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

// Track connected users
const connectedUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket.IO middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket for later use
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    // Add user to connected users map
    connectedUsers.set(socket.user.id, {
      socketId: socket.id,
      userId: socket.user.id,
      lastSeen: new Date()
    });

    // Handle private messages
    socket.on('private_message', async (data, callback) => {
      try {
        const { receiverId, content } = data;
        const message = await Message.create({
          senderId: socket.user.id,
          receiverId,
          content,
          status: 'sent'
        });

        // Emit to receiver if online
        const receiver = connectedUsers.get(receiverId);
        if (receiver) {
          io.to(receiver.socketId).emit('new_message', message);
          // Update message status to delivered
          await message.update({ status: 'delivered' });
        }

        callback({ status: 'ok', message });
      } catch (error) {
        console.error('Error sending message:', error);
        callback({ status: 'error', message: error.message });
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('user_typing', { 
        userId: socket.user.id, 
        isTyping 
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
      connectedUsers.delete(socket.user.id);
    });
  });

  return io;
};

module.exports = { initializeSocket, connectedUsers };
