import { Op, Model } from 'sequelize';
import ChatMessageModel, { ChatMessageAttributes } from '../models/ChatMessage';
import UserModel, { IUserAttributes } from '../models/User';

// Type for room object from the database
interface RoomResult {
  room_id: string;
  [key: string]: any;
}

// Extended interfaces for models
type UserInstance = Model<IUserAttributes> & IUserAttributes & {
  id: number;
  name: string;
  role: 'user' | 'responder' | 'admin';
  avatar?: string;
};

type ChatMessageModelType = Model<ChatMessageAttributes> & ChatMessageAttributes & {
  id: number;
  room_id: string;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
  getDataValue: (key: string) => any;
  get: (key: string, options?: any) => any;
  sender?: UserInstance;
  receiver?: UserInstance;
};

type ChatMessageInstance = Omit<ChatMessageModelType, 'get' | 'getDataValue'> & {
  sender?: Omit<UserInstance, keyof Model>;
  receiver?: Omit<UserInstance, keyof Model>;
};

// Interface for conversation item
interface IConversationItem {
  roomId: string;
  otherUser: {
    id: number;
    name: string;
    role: 'user' | 'responder' | 'admin';
    avatar?: string;
  };
  lastMessage?: {
    id: number;
    message: string;
    timestamp: Date;
    isRead: boolean;
  };
  unreadCount: number;
}

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
  static async createMessage({ roomId, senderId, receiverId, message }: ICreateChatMessage): Promise<ChatMessageInstance> {
    const result = await ChatMessageModel.create({
      room_id: roomId,
      sender_id: senderId,
      receiver_id: receiverId,
      message,
      is_read: false,
    });
    
    // Fetch the created message with associations
    const createdMessage = (await ChatMessageModel.findByPk(result.id, {
      include: [
        {
          model: UserModel,
          as: 'sender',
          attributes: ['id', 'name', 'role', 'avatar'],
        },
        {
          model: UserModel,
          as: 'receiver',
          attributes: ['id', 'name', 'role', 'avatar'],
        },
      ],
    })) as unknown as ChatMessageModelType;
    
    if (!createdMessage) {
      throw new Error('Failed to create message');
    }
    
    const plainMsg = createdMessage.get({ plain: true }) as ChatMessageAttributes & {
      sender?: UserInstance;
      receiver?: UserInstance;
    };
    
    return {
      ...plainMsg,
      sender: plainMsg.sender ? {
        id: plainMsg.sender.id,
        name: plainMsg.sender.name,
        role: plainMsg.sender.role as 'user' | 'responder' | 'admin',
        avatar: plainMsg.sender.avatar
      } : undefined,
      receiver: plainMsg.receiver ? {
        id: plainMsg.receiver.id,
        name: plainMsg.receiver.name,
        role: plainMsg.receiver.role as 'user' | 'responder' | 'admin',
        avatar: plainMsg.receiver.avatar
      } : undefined
    } as ChatMessageInstance;
  }

  /**
   * Get messages for a chat room
   */
  static async getMessages({ roomId, userId, limit = 50, before }: IGetChatMessages): Promise<ChatMessageInstance[]> {
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

    const messages = await ChatMessageModel.findAll({
      where,
      include: [
        {
          model: UserModel,
          as: 'sender',
          attributes: ['id', 'name', 'role', 'avatar'],
        },
        {
          model: UserModel,
          as: 'receiver',
          attributes: ['id', 'name', 'role', 'avatar'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
    });

    // Convert model instances to plain objects with proper typing
    return (messages as unknown as ChatMessageModelType[]).map(msg => {
      const plainMsg = msg.get({ plain: true }) as ChatMessageAttributes & {
        sender?: UserInstance;
        receiver?: UserInstance;
      };
      
      return {
        ...plainMsg,
        sender: plainMsg.sender ? {
          id: plainMsg.sender.id,
          name: plainMsg.sender.name,
          role: plainMsg.sender.role as 'user' | 'responder' | 'admin',
          avatar: plainMsg.sender.avatar
        } : undefined,
        receiver: plainMsg.receiver ? {
          id: plainMsg.receiver.id,
          name: plainMsg.receiver.name,
          role: plainMsg.receiver.role as 'user' | 'responder' | 'admin',
          avatar: plainMsg.receiver.avatar
        } : undefined
      } as ChatMessageInstance;
    });
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(roomId: string, userId: number, senderId: number): Promise<[number]> {
    const [affectedCount] = await ChatMessageModel.update(
      { is_read: true },
      {
        where: {
          room_id: roomId,
          sender_id: senderId,
          receiver_id: userId,
          is_read: false
        },
        returning: true
      }
    );
    return [affectedCount];
  }

  /**
   * Get user's chat conversations
   */
  static async getUserConversations(userId: number): Promise<IConversationItem[]> {
    try {
      // Get all unique room IDs where the user is either sender or receiver
      const rooms = await ChatMessageModel.findAll({
        attributes: ['room_id'],
        where: {
          [Op.or]: [
            { sender_id: userId },
            { receiver_id: userId }
          ]
        },
        group: ['room_id']
      });

      // Process each room to get conversation details
      const conversationPromises = rooms.map(async (room: RoomResult) => {
        const roomId = room.room_id;

        // Get the last message in the room
        const lastMessage = (await ChatMessageModel.findOne({
          where: { room_id: roomId },
          order: [['created_at', 'DESC']],
          include: [
            {
              model: UserModel,
              as: 'sender',
              attributes: ['id', 'name', 'role', 'avatar']
            },
            {
              model: UserModel,
              as: 'receiver',
              attributes: ['id', 'name', 'role', 'avatar']
            }
          ]
        })) as unknown as ChatMessageModelType | null;

        if (!lastMessage) {
          return null;
        }

        const plainMsg = lastMessage.get({ plain: true }) as ChatMessageAttributes & {
          sender?: UserInstance;
          receiver?: UserInstance;
        };

        if (!plainMsg.sender || !plainMsg.receiver) {
          return null;
        }


        // Get the other user in the conversation
        const currentUserIsSender = plainMsg.sender_id === userId;
        const otherUser = currentUserIsSender ? plainMsg.receiver : plainMsg.sender;

        // Get unread message count
        const unreadCount = await ChatMessageModel.count({
          where: {
            room_id: roomId,
            sender_id: otherUser.id,
            receiver_id: userId,
            is_read: false
          }
        });

        return {
          roomId,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            role: otherUser.role as 'user' | 'responder' | 'admin',
            avatar: otherUser.avatar
          },
          lastMessage: {
            id: plainMsg.id,
            message: plainMsg.message,
            timestamp: plainMsg.created_at,
            isRead: plainMsg.is_read
          },
          unreadCount
        } as IConversationItem;
      });

      const conversations = await Promise.all(conversationPromises);

      // Filter out any null conversations and sort by most recent message
      return conversations
        .filter((conv): conv is IConversationItem => conv !== null)
        .sort((a, b) => {
          const aTime = a.lastMessage?.timestamp?.getTime() || 0;
          const bTime = b.lastMessage?.timestamp?.getTime() || 0;
          return bTime - aTime;
        });
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return [];
    }
  }
}

export default ChatService;
