import { Server as SocketIOServer } from 'socket.io';
import { User } from '../../models';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      io?: SocketIOServer;
    }
  }
}

export {};
