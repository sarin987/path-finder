import { Op, Model } from 'sequelize';
import { 
  ChatMessageAttributes, 
  ChatMessageCreationAttributes, 
  ConversationAttributes, 
  ConversationCreationAttributes, 
  UserAttributes 
} from '../types/models';

// Using require to avoid TypeScript module resolution issues
const { ChatMessage, Conversation, User } = require('../../models');
// Type declarations for models

export interface ICreateMessage {
  conversationId: number;
  senderId: number;
  message: string;
  messageType?: 'text' | 'image' | 'location' | 'file';
  content?: any;
  parentMessageId?: number;
}

export interface IGetMessages {
  conversationId: number;
  userId: number;
  limit?: number;
  before?: Date;
}

export interface ICreateConversation {
  participantIds: number[];
  createdBy: number;
  serviceType: string;
  metadata?: any;
}

class ChatServiceV2 {
  /**
   * Create a new conversation
   */
  static async createConversation({
    participantIds,
    createdBy,
    serviceType,
    metadata = {}
  }: ICreateConversation) {
    // Ensure the creator is included in participants
    const participants = [...new Set([...participantIds, createdBy])];
    
    return await Conversation.create({
      participant_ids: participants,
      created_by: createdBy,
      service_type: serviceType,
      is_group: participants.length > 2,
      metadata
    });
  }

  /**
   * Get a conversation by ID with participants
   */
  static async getConversation(id: number, userId: number) {
    return await Conversation.findOne({
      where: {
        id,
        participant_ids: {
          [Op.contains]: [userId]
        }
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ChatMessage,
          as: 'messages',
          limit: 20,
          order: [['created_at', 'DESC']],
          include: [
            { model: User, as: 'sender', attributes: ['id', 'name'] },
            { model: User, as: 'receiver', attributes: ['id', 'name'] }
          ]
        }
      ]
    });
  }

  /**
   * Get user's conversations
   */
  static async getUserConversations(userId: number, limit = 20, offset = 0) {
    return await Conversation.findAndCountAll({
      where: {
        participant_ids: {
          [Op.contains]: [userId]
        }
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ChatMessage,
          as: 'lastMessage',
          include: [
            { model: User, as: 'sender', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['updated_at', 'DESC']],
      limit,
      offset
    });
  }

  /**
   * Create a new message
   */
  static async createMessage({
    conversationId,
    senderId,
    message,
    messageType = 'text',
    content = {},
    parentMessageId
  }: ICreateMessage) {
    const transaction = await ChatMessage.sequelize!.transaction();
    
    try {
      // Create the message
      const newMessage = await ChatMessage.create({
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: 0, // Will be set based on conversation participants
        message,
        message_type: messageType,
        content: messageType === 'text' ? { text: message, ...content } : content,
        parent_message_id: parentMessageId,
        status: 'sent',
        is_read: false
      }, { transaction });

      // Update conversation's last message
      await Conversation.update(
        { last_message_id: newMessage.id },
        { where: { id: conversationId }, transaction }
      );

      // Get conversation with participants
      const conversation = await Conversation.findByPk(conversationId, {
        include: [
          { 
            model: User,
            as: 'participants',
            attributes: ['id'],
            through: { attributes: [] }
          }
        ],
        transaction
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Update receiver_id to be the other participant in a 1:1 chat
      if (!conversation.is_group) {
        const receiverId = conversation.participant_ids.find((id: number) => id !== senderId);
        if (receiverId) {
          await newMessage.update({ receiver_id: receiverId }, { transaction });
        }
      }

      await transaction.commit();
      
      // Reload the message with associations
      return await ChatMessage.findByPk(newMessage.id, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'name'] },
          { model: User, as: 'receiver', attributes: ['id', 'name'] },
          {
            model: ChatMessage,
            as: 'parentMessage',
            include: [
              { model: User, as: 'sender', attributes: ['id', 'name'] }
            ]
          }
        ]
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages({
    conversationId,
    userId,
    limit = 50,
    before
  }: IGetMessages) {
    const { Op } = require('sequelize');
    // Verify user has access to this conversation
    const hasAccess = await Conversation.count({
      where: {
        id: conversationId,
        participant_ids: {
          [Op.contains]: [userId]
        }
      }
    });

    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const where: any = {
      conversation_id: conversationId
    };

    if (before) {
      where.created_at = { [Op.lt]: before };
    }

    return await ChatMessage.findAll({
      where,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar'] },
        {
          model: ChatMessage,
          as: 'parentMessage',
          include: [
            { model: User, as: 'sender', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit
    });
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(conversationId: number, userId: number, messageIds: number[]) {
    const { Op } = require('sequelize');
    return await ChatMessage.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          id: { [Op.in]: messageIds },
          conversation_id: conversationId,
          receiver_id: userId,
          is_read: false
        },
        returning: true
      }
    );
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: number): Promise<number> {
    const result = await ChatMessage.count({
      where: {
        receiver_id: userId,
        is_read: false
      },
      group: ['conversation_id']
    });

    return result.length;
  }
}

export default ChatServiceV2;
