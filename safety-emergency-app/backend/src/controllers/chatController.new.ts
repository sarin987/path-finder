import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Server as SocketIOServer } from 'socket.io';
import ChatService from '../services/chatService';
import db from '../models';

// Extend Express Request type to include user and io
declare global {
  namespace Express {
    interface Request {
      io?: SocketIOServer;
      user?: {
        id: number;
        name: string;
        role: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Get chat messages for a specific room
 */
const getChatHistory = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { roomId } = req.params;
    const { before } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const messages = await ChatService.getMessages({
      roomId,
      userId: req.user.id,
      before: before ? new Date(before as string) : undefined,
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
};

/**
 * Get user's chat conversations
 */
const getChatRooms = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const conversations = await ChatService.getUserConversations(req.user.id);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ message: 'Error fetching chat rooms' });
  }
};

/**
 * Send a new chat message
 */
const sendMessage = async (req: Request, res: Response): Promise<Response | void> => {
  const io = req.io;
  try {
    const { roomId, receiverId, message } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roomId || !receiverId || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newMessage = await ChatService.createMessage({
      roomId,
      senderId: req.user.id,
      receiverId,
      message,
    });

    // Emit socket event
    if (io) {
      // Emit to the room
      io.to(roomId).emit('new_message', {
        ...newMessage.toJSON(),
        sender: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role,
        },
      });

      // Emit notification to receiver
      io.to(`user_${receiverId}`).emit('new_message_notification', {
        roomId,
        senderId: req.user.id,
        message: newMessage.message,
        timestamp: newMessage.created_at,
      });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
};

/**
 * Mark messages as read
 */
const markAsRead = async (req: Request, res: Response): Promise<Response | void> => {
  const io = req.io;
  try {
    const { roomId, senderId } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await ChatService.markAsRead(roomId, req.user.id, senderId);
    
    // Emit read receipt
    if (io) {
      io.to(`user_${senderId}`).emit('messages_read', {
        roomId,
        readerId: req.user.id,
        timestamp: new Date(),
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
};

// Export all methods as named exports
export {
  getChatHistory,
  getChatRooms,
  sendMessage,
  markAsRead,
};

// Export default object with all methods
export default {
  getChatHistory,
  getChatRooms,
  sendMessage,
  markAsRead,
};
