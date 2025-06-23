import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validationResult } from 'express-validator';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import path from 'path';
import ChatServiceV2, { ICreateMessage, ICreateConversation } from '../services/chatServiceV2';
import FileService, { IFileData } from '../services/fileService';
import { uploadFile } from '../utils/fileUpload';
// Using require to avoid TypeScript module resolution issues
const { ChatMessage, Conversation, User } = require('../../models');
import { UserAttributes } from '../types/models';

// Extend Express Request type
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
 * Get conversation by ID
 */
export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const conversation = await ChatServiceV2.getConversation(parseInt(conversationId, 10), userId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or access denied' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error getting conversation:', error);
    next(error);
  }
};

/**
 * Get user's conversations
 */
export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { rows: conversations, count } = await ChatServiceV2.getUserConversations(
      userId,
      parseInt(limit as string, 10),
      parseInt(offset as string, 10)
    );

    res.json({
      conversations,
      total: count,
      hasMore: count > parseInt(offset as string, 10) + conversations.length
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    next(error);
  }
};

/**
 * Create a new conversation
 */
export const createConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;
    const { participantIds, serviceType, metadata } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // For 1:1 chat, check if conversation already exists
    if (participantIds.length === 1) {
      const existingConversation = await Conversation.findOne({
        where: {
          is_group: false,
          participant_ids: {
            [Op.contains]: [...participantIds, userId]
          }
        } as any
      });

      if (existingConversation) {
        return res.status(200).json(existingConversation);
      }
    }

    const conversation = await ChatServiceV2.createConversation({
      participantIds: [...participantIds, userId],
      createdBy: userId,
      serviceType: serviceType || 'direct',
      metadata
    });

    // Emit new conversation event to all participants
    if (req.io) {
      const participantIds = conversation.getDataValue('participant_ids') as number[];
      participantIds.forEach((participantId: number) => {
        req.io?.to(`user_${participantId}`).emit('conversation:new', conversation);
      });
    }

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    next(error);
  }
};

/**
 * Send a new message
 */
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Handle file upload if present
    await new Promise<void>((resolve, reject) => {
      uploadFile(req, res, (err: any) => {
        if (err) {
          return reject(new Error(err.message || 'Error uploading file'));
        }
        resolve();
      });
    });

    const { conversationId, message, messageType = 'text', content = {}, parentMessageId } = req.body;
    const userId = (req.user as UserAttributes).id;

    const messageData: ICreateMessage = {
      conversationId,
      senderId: userId,
      message,
      messageType: req.file ? 'file' : messageType,
      content: { ...content },
      parentMessageId,
    };

    // Create the message
    const newMessage = await ChatServiceV2.createMessage(messageData);

    // Handle file upload if present
    let fileData = null;
    if (req.file) {
      fileData = FileService.processUploadedFile(
        req,
        req.file,
        newMessage.id,
        userId
      );
      
      // Save file info to database
      const { url, ...fileInfo } = fileData;
      await FileService.saveFile(fileInfo);
      
      // Update message content with file info
      newMessage.content = {
        ...newMessage.content,
        file: {
          url,
          type: fileInfo.type,
          name: fileInfo.original_name,
          size: fileInfo.size,
        },
      };
      
      await newMessage.save();
    }

    // Emit new message event to all participants
    if (req.io) {
      const conversation = await Conversation.findByPk(conversationId, {
        attributes: ['participant_ids']
      });

      if (conversation) {
        const participantIds = conversation.getDataValue('participant_ids') as number[];
        participantIds.forEach((participantId: number) => {
          if (participantId !== userId) { // Don't emit to sender
            req.io?.to(`user_${participantId}`).emit('message:new', newMessage);
          }
        });
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    const { before, limit = 50 } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const messages = await ChatServiceV2.getMessages({
      conversationId: parseInt(conversationId, 10),
      userId,
      limit: parseInt(limit as string, 10),
      before: before ? new Date(before as string) : undefined
    });

    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    next(error);
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId, messageIds } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'messageIds must be a non-empty array' });
    }

    const [count] = await ChatServiceV2.markAsRead(
      parseInt(conversationId, 10),
      userId,
      messageIds
    );

    // Emit read receipt
    if (req.io && count > 0) {
      const conversation = await Conversation.findByPk(conversationId, {
        attributes: ['participant_ids']
      });

      if (conversation) {
        const participantIds = conversation.getDataValue('participant_ids') as number[];
        participantIds.forEach((participantId: number) => {
          if (participantId !== userId) { // Don't emit to self
            req.io?.to(`user_${participantId}`).emit('messages:read', {
              conversationId,
              messageIds,
              readBy: userId,
              readAt: new Date()
            });
          }
        });
      }
    }

    res.json({ success: true, count });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    next(error);
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const count = await ChatServiceV2.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    next(error);
  }
};

// Export all methods as named exports
export const chatControllerV2 = {
  getConversation,
  getConversations,
  createConversation,
  sendMessage,
  getMessages,
  markAsRead,
  getUnreadCount
};

export default chatControllerV2;
