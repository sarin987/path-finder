import { Request, Response } from 'express';
import { ChatMessage, ChatMessageAttributes } from '../models/ChatMessage';
import { User } from '../models/User';
import { Op } from 'sequelize';

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = (req as any).user;

    // Get all messages between current user and the other user
    const messages = await ChatMessage.findAll({
      where: {
        [Op.or]: [
          {
            sender_id: currentUser.id,
            receiver_id: userId,
          },
          {
            sender_id: userId,
            receiver_id: currentUser.id,
          },
        ],
      },
      order: [['created_at', 'ASC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    // Mark messages as read
    await ChatMessage.update(
      { is_read: true },
      {
        where: {
          sender_id: userId,
          receiver_id: currentUser.id,
          is_read: false,
        },
      }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
};

export const getChatRooms = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    // Get all unique users that the current user has chatted with
    const chatPartners = await ChatMessage.findAll({
      attributes: [
        [
          sequelize.literal(
            `CASE WHEN sender_id = ${currentUser.id} THEN receiver_id ELSE sender_id END`
          ),
          'partner_id',
        ],
      ],
      where: {
        [Op.or]: [
          { sender_id: currentUser.id },
          { receiver_id: currentUser.id },
        ],
      },
      group: ['partner_id'],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'role'],
          required: false,
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email', 'role'],
          required: false,
        },
      ],
    });

    // Format the response
    const rooms = chatPartners.map((msg: any) => {
      const partner =
        msg.sender?.id === currentUser.id ? msg.receiver : msg.sender;
      return {
        userId: partner.id,
        name: partner.name,
        email: partner.email,
        role: partner.role,
        unreadCount: 0, // You can add logic to count unread messages
        lastMessage: msg.message,
        lastMessageAt: msg.created_at,
      };
    });

    res.json(rooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ message: 'Error fetching chat rooms' });
  }
};

export const sendMessage = async (
  senderId: number,
  receiverId: number,
  message: string,
  io: any
) => {
  try {
    // Create room ID by combining user IDs in a consistent order
    const roomId = [senderId, receiverId].sort().join('_');

    const newMessage = await ChatMessage.create({
      room_id: roomId,
      sender_id: senderId,
      receiver_id: receiverId,
      message,
      is_read: false,
    });

    // Populate sender info for the response
    const messageWithSender = await ChatMessage.findByPk(newMessage.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    // Emit the message to the room
    io.to(roomId).emit('newMessage', messageWithSender);

    // Emit notification to the receiver
    io.to(`user_${receiverId}`).emit('newMessageNotification', {
      from: senderId,
      message: messageWithSender,
    });

    return messageWithSender;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
