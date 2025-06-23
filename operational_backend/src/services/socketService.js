const { Server } = require('socket.io');
const { verify } = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const { User, Message } = require('../models');
const ChatService = require('./chatService');
const { Op } = require('sequelize');

// Map to track typing users
const typingUsers = new Map(); // roomId -> Set<userId>

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e8 // 100MB
    });

    this.users = new Map(); // userId -> socketId
    this.initializeMiddlewares();
    this.initializeEventHandlers();
  }

  initializeMiddlewares() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = verify(token, JWT_SECRET);
        const user = await User.findByPk(decoded.userId, {
          attributes: { exclude: ['password'] }
        });

        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        // Attach user to socket for later use
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  /**
   * Handle user disconnection
   * @param {Socket} socket - Socket instance
   */
  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.id}`);
    
    if (socket.user) {
      // Remove from online users
      this.users.delete(socket.user.id);
      
      // Update last active time
      socket.user.update({ lastActive: new Date() });
      
      // Notify others that this user is offline
      socket.broadcast.emit('user_offline', { 
        userId: socket.user.id,
        lastActive: new Date()
      });
      
      // Clean up typing indicators
      typingUsers.forEach((users, roomId) => {
        if (users.has(socket.user.id)) {
          users.delete(socket.user.id);
          if (users.size === 0) {
            typingUsers.delete(roomId);
          } else {
            typingUsers.set(roomId, users);
          }
          
          // Notify room that user stopped typing
          socket.to(roomId).emit('user_typing', {
            roomId,
            userId: socket.user.id,
            isTyping: false,
            typingUsers: Array.from(users)
          });
        }
      });
    }
  }
  
  initializeEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);
      
      // Store user's socket ID and mark as online
      if (socket.user) {
        this.users.set(socket.user.id, socket.id);
        console.log(`User ${socket.user.id} connected with socket ${socket.id}`);
        
        // Update user's last active time
        socket.user.update({ lastActive: new Date() });
        
        // Notify others that this user is online
        socket.broadcast.emit('user_online', { 
          userId: socket.user.id,
          lastActive: socket.user.lastActive
        });
        
        // Send user's online status to the connected user
        const onlineUsers = Array.from(this.users.keys())
          .filter(userId => userId !== socket.user.id);
        socket.emit('online_users', { users: onlineUsers });
      }

      // Join room (for private messages)
      socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.user?.id} joined room ${roomId}`);
        
        // Mark messages as read when joining a room
        if (socket.user) {
          this.markMessagesAsRead(socket.user.id, roomId);
        }
      });

      // Leave room
      socket.on('leave_room', (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.user?.id} left room ${roomId}`);
      });
      
      // Typing indicator
      socket.on('typing', async ({ roomId, isTyping }) => {
        if (!socket.user) return;
        
        const userId = socket.user.id;
        let roomTypingUsers = typingUsers.get(roomId) || new Set();
        
        if (isTyping) {
          roomTypingUsers.add(userId);
        } else {
          roomTypingUsers.delete(userId);
        }
        
        typingUsers.set(roomId, roomTypingUsers);
        
        // Broadcast to others in the room
        socket.to(roomId).emit('user_typing', {
          roomId,
          userId,
          isTyping,
          typingUsers: Array.from(roomTypingUsers)
        });
      });
      
      // Message read receipt
      socket.on('mark_messages_read', async ({ messageIds, roomId }) => {
        if (!socket.user) return;
        
        try {
          const updatedCount = await ChatService.markAsRead(messageIds, socket.user.id);
          
          // Notify the sender that messages were read
          const messages = await Message.findAll({
            where: { id: messageIds },
            attributes: ['id', 'senderId']
          });
          
          const senders = new Set(messages.map(m => m.senderId));
          senders.forEach(senderId => {
            const senderSocketId = this.users.get(senderId);
            if (senderSocketId) {
              this.io.to(senderSocketId).emit('messages_read', {
                messageIds,
                readBy: socket.user.id,
                readAt: new Date()
              });
            }
          });
          
          return { success: true, count: updatedCount };
        } catch (error) {
          console.error('Error marking messages as read:', error);
          return { success: false, error: error.message };
        }
      });
      
      // Message reaction
      socket.on('react_to_message', async ({ messageId, reaction }, callback) => {
        if (!socket.user) return;
        
        try {
          const updatedMessage = await ChatService.addReaction(
            messageId,
            socket.user.id,
            reaction
          );
          
          // Notify all clients in the room
          if (updatedMessage) {
            const roomId = updatedMessage.roomId;
            this.io.to(roomId).emit('message_updated', updatedMessage);
            
            if (typeof callback === 'function') {
              callback({ success: true, message: updatedMessage });
            }
          }
        } catch (error) {
          console.error('Error adding reaction:', error);
          if (typeof callback === 'function') {
            callback({ success: false, error: error.message });
          }
        }
      });
      
      // Edit message
      socket.on('edit_message', async ({ messageId, content }, callback) => {
        if (!socket.user) return;
        
        try {
          const updatedMessage = await ChatService.editMessage(
            messageId,
            socket.user.id,
            content
          );
          
          // Notify all clients in the room
          if (updatedMessage) {
            const roomId = updatedMessage.roomId;
            this.io.to(roomId).emit('message_updated', updatedMessage);
            
            if (typeof callback === 'function') {
              callback({ success: true, message: updatedMessage });
            }
          }
        } catch (error) {
          console.error('Error editing message:', error);
          if (typeof callback === 'function') {
            callback({ success: false, error: error.message });
          }
        }
      });
      
      // Delete message
      socket.on('delete_message', async ({ messageId, forEveryone }, callback) => {
        if (!socket.user) return;
        
        try {
          const success = await ChatService.deleteMessage(
            messageId,
            socket.user.id,
            forEveryone
          );
          
          if (success) {
            const message = await Message.findByPk(messageId);
            if (message) {
              const roomId = message.roomId;
              this.io.to(roomId).emit('message_deleted', {
                messageId,
                deletedFor: message.deletedFor,
                deletedBy: socket.user.id,
                forEveryone
              });
            }
            
            if (typeof callback === 'function') {
              callback({ success: true });
            }
          }
        } catch (error) {
          console.error('Error deleting message:', error);
          if (typeof callback === 'function') {
            callback({ success: false, error: error.message });
          }
        }
      });

      // Handle private messages
      socket.on('private_message', async (data, callback) => {
        if (!socket.user) {
          if (typeof callback === 'function') {
            callback({ success: false, error: 'Not authenticated' });
          }
          return;
        }

        const { to, message, type = 'text', metadata = {}, replyTo } = data;
        
        try {
          // Save message to database
          const messageRecord = await ChatService.sendMessage({
            senderId: socket.user.id,
            receiverId: to,
            message,
            type,
            metadata,
            roomId: this.getRoomId(socket.user.id, to),
            parentMessageId: replyTo
          });

          // Mark as delivered
          await ChatService.markAsDelivered(messageRecord.id);
          
          // Get the full message with user data
          const fullMessage = await ChatService.getMessageById(messageRecord.id);

          // Emit to sender
          socket.emit('message_sent', fullMessage);
          
          // Acknowledge the message was sent
          if (typeof callback === 'function') {
            callback({ success: true, message: fullMessage });
          }

          // Emit to receiver if online
          const receiverSocketId = this.users.get(parseInt(to));
          if (receiverSocketId) {
            // Mark as delivered
            await ChatService.markAsDelivered(messageRecord.id);
            
            // Emit to receiver
            this.io.to(receiverSocketId).emit('new_message', {
              ...fullMessage.toJSON(),
              status: 'delivered'
            });
          }
        } catch (error) {
          console.error('Error in private_message:', error);
          if (typeof callback === 'function') {
            callback({ success: false, error: error.message });
          } else {
            socket.emit('error', { message: 'Failed to send message', error: error.message });
          }
        }
      });

      // Typing indicator
      socket.on('typing', (data) => {
        const { to, isTyping } = data;
        const receiverSocketId = this.users.get(parseInt(to));
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('user_typing', {
            userId: socket.user.id,
            isTyping
          });
        }
      });

      // Mark messages as read
      socket.on('mark_as_read', async (data) => {
        const { messageIds } = data;
        try {
          // First update all messages as read
          await Message.update(
            { isRead: true },
            { where: { id: messageIds, receiverId: socket.user.id } }
          );
          
          // Then find all messages to get sender info
          const messages = await Message.findAll({
            where: { id: messageIds },
            attributes: ['id', 'senderId']
          });
          
          // Group messages by sender
          const messagesBySender = {};
          messages.forEach(message => {
            if (!messagesBySender[message.senderId]) {
              messagesBySender[message.senderId] = [];
            }
            messagesBySender[message.senderId].push(message.id);
          });
          
          // Notify each sender about their read messages
          Object.entries(messagesBySender).forEach(([senderId, msgIds]) => {
            const senderSocketId = this.users.get(parseInt(senderId));
            if (senderSocketId) {
              this.io.to(senderSocketId).emit('messages_read', {
                messageIds: msgIds,
                readAt: new Date()
              });
            }
          });
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  getIO() {
    return this.io;
  }

  // Helper to generate a consistent room ID for two users
  /**
   * Generate a consistent room ID for two users
   * @param {number|string} user1 - First user ID
   * @param {number|string} user2 - Second user ID
   * @returns {string} Room ID
   */
  getRoomId(user1, user2) {
    return [user1, user2].sort().join('_');
  }

  /**
   * Mark all messages in a room as read for a user
   * @param {number} userId - User ID
   * @param {string} roomId - Room ID
   */
  async markMessagesAsRead(userId, roomId) {
    try {
      // Find all unread messages in this room for this user
      const unreadMessages = await Message.findAll({
        where: {
          roomId,
          receiverId: userId,
          status: { [Op.in]: ['sent', 'delivered'] }
        },
        attributes: ['id']
      });

      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map((m) => m.id);
        await ChatService.markAsRead(messageIds, userId);

        // Notify senders that their messages were read
        const messages = await Message.findAll({
          where: { id: messageIds },
          attributes: ['id', 'senderId']
        });

        const senders = new Set(messages.map((m) => m.senderId));
        senders.forEach((senderId) => {
          const senderSocketId = this.users.get(senderId);
          if (senderSocketId) {
            this.io.to(senderSocketId).emit('messages_read', {
              messageIds,
              readBy: userId,
              readAt: new Date()
            });
          }
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Send message to a specific user
  sendToUser(userId, event, data) {
    const socketId = this.users.get(parseInt(userId));
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Broadcast to all connected clients
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  // Send to all clients in a room
  sendToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }
}

module.exports = SocketService;
