import { Server as SocketIOServer } from 'socket.io';
import User from '../../models/User';
import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      io?: SocketIOServer;
      file?: Express.Multer.File;
      files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
    }
  }
}

export {};
