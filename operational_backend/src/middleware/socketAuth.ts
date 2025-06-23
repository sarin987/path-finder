import { verify } from 'jsonwebtoken';
import { Socket } from 'socket.io';
import db from '../models';
const { User } = db;
import { JWT_SECRET } from '../config/constants';

export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    // Get token from query parameters or headers
    const token = socket.handshake.auth?.token || 
                 socket.handshake.query?.token as string;

    if (!token) {
      return next(new Error('No token provided'));
    }

    // Verify token
    const decoded = verify(token, JWT_SECRET) as { userId: number };
    
    // Find user in database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user to socket for later use
    socket.data.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
};
