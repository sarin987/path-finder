import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { authenticateSocket } from './middleware/socketAuth';
import { sendMessage } from './controllers/chatController';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket.IO middleware for authentication
  io.use(async (socket: any, next) => {
    try {
      const user = await authenticateSocket(socket);
      if (!user) {
        return next(new Error('Authentication error'));
      }
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: any) => {
    const userId = socket.user.id;
    console.log(`User connected: ${userId}`);

    // Join user's personal room for notifications
    socket.join(`user_${userId}`);

    // Handle joining a chat room
    socket.on('joinRoom', (roomId: string) => {
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
    });

    // Handle leaving a chat room
    socket.on('leaveRoom', (roomId: string) => {
      socket.leave(roomId);
      console.log(`User ${userId} left room ${roomId}`);
    });

    // Handle sending a message
    socket.on('sendMessage', async (data: { receiverId: number; message: string }) => {
      try {
        const message = await sendMessage(
          userId,
          data.receiverId,
          data.message,
          io
        );
        // The message is already emitted from the controller
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
      socket.to(data.roomId).emit('userTyping', {
        userId,
        isTyping: data.isTyping,
      });
    });

    // Handle message read receipt
    socket.on('markAsRead', async (data: { messageId: number }) => {
      try {
        // Update message as read in the database
        await Message.update(
          { is_read: true },
          {
            where: {
              id: data.messageId,
              receiver_id: userId,
            },
          }
        );
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
