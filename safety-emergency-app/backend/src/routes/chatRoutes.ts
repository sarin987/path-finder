import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { authenticateToken } from '../middleware/auth';
import * as chatController from '../controllers/chatController.new';

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

const router = Router();

// Protect all routes with authentication
router.use((req, res, next) => {
  // Attach io to request
  req.io = req.app.get('io');
  next();
});

router.use(authenticateToken as RequestHandler);

// Get chat messages for a specific room
router.get('/rooms/:roomId/messages', (req: Request, res: Response, next: NextFunction) => 
  (chatController.getChatHistory as RequestHandler)(req, res, next)
);

// Get all chat conversations for the current user
router.get('/conversations', (req: Request, res: Response, next: NextFunction) => 
  (chatController.getChatRooms as RequestHandler)(req, res, next)
);

// Send a new message
router.post('/messages', (req: Request, res: Response, next: NextFunction) => 
  (chatController.sendMessage as RequestHandler)(req, res, next)
);

// Mark messages as read
router.post('/messages/read', (req: Request, res: Response, next: NextFunction) => 
  (chatController.markAsRead as RequestHandler)(req, res, next)
);

export default router;
