import { Op } from 'sequelize';
import { ChatMessage, User } from '../models';

export interface ICreateChatMessage {
  roomId: string;
  senderId: number;
  receiverId: number;
  message: string;
}

export interface IGetChatMessages {
  roomId: string;
  userId: number;
  limit?: number;
  before?: Date;
}

class ChatService {
  /**
   * Create a new chat message
   */
  static async createMessage({ roomId, senderId, receiverId, message }: ICreateChatMessage) {
    return await ChatMessage.create({
      room_id: roomId,
      sender_id: senderId,
      receiver_id: receiverId,
      message,
      is_read: false,
    });
  }

  /**
   * Get messages for a chat room
   */
  static async getMessages({ roomId, userId, limit = 50, before }: IGetChatMessages) {
    const where: any = {
      room_id: roomId,
      [Op.or]: [
        { sender_id: userId },
        { receiver_id: userId },
      ],
    };

    if (before) {
      where.created_at = { [Op.lt]: before };
    }

    return await ChatMessage.findAll({
      where,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'role'],
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'role'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
    });
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(roomId: string, userId: number, senderId: number) {
    return await ChatMessage.update(
      { is_read: true },
      {
        where: {
          room_id: roomId,
          sender_id: senderId,
          receiver_id: userId,
          is_read: false,
        },
      }
    );
  }

  /**
   * Get user's chat conversations
   */
  static async getUserConversations(userId: number) {
    // Get all unique room IDs where the user is either sender or receiver
    const rooms = await ChatMessage.findAll({
      attributes: ['room_id'],
      where: {
        [Op.or]: [
          { sender_id: userId },
          { receiver_id: userId },
        ],
      },
      group: ['room_id'],
      raw: true,
    });

    // Get the latest message for each room
    const conversations = await Promise.all(
      rooms.map(async ({ room_id }) => {
        const [latestMessage] = await ChatMessage.findAll({
          where: { room_id },
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'name', 'role'],
            },
            {
              model: User,
              as: 'receiver',
              attributes: ['id', 'name', 'role'],
            },
          ],
          order: [['created_at', 'DESC']],
          limit: 1,
        });

        // Get the other user in the conversation
        const otherUser = 
          latestMessage.sender.id === userId 
            ? latestMessage.receiver 
            : latestMessage.sender;

        return {
          roomId: room_id,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            role: otherUser.role,
          },
          lastMessage: {
            id: latestMessage.id,
            message: latestMessage.message,
            isRead: latestMessage.is_read,
            createdAt: latestMessage.created_at,
          },
          unreadCount: await ChatMessage.count({
            where: {
              room_id: room_id,
              sender_id: otherUser.id,
              receiver_id: userId,
              is_read: false,
            },
          }),
        };
      })
    );

    // Sort by most recent message
    return conversations.sort(
      (a, b) => 
        new Date(b.lastMessage.createdAt).getTime() - 
        new Date(a.lastMessage.createdAt).getTime()
    );
  }
}

export default ChatService;
