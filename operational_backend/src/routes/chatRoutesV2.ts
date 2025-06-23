import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { body, param, query } from 'express-validator';
import { Server as SocketIOServer } from 'socket.io';
import { authenticateToken } from '../middleware/auth';
import chatControllerV2 from '../controllers/chatControllerV2';

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

const router = Router();

// Middleware to attach io to request
router.use((req: Request, res: Response, next: NextFunction) => {
  req.io = req.app.get('io');
  next();
});

// Apply authentication middleware to all routes
router.use(authenticateToken as RequestHandler);

// Get conversation by ID
router.get(
  '/conversations/:conversationId',
  [
    param('conversationId').isInt().withMessage('Invalid conversation ID')
  ],
  chatControllerV2.getConversation as RequestHandler
);

// Get user's conversations
router.get(
  '/conversations',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a positive integer')
  ],
  chatControllerV2.getConversations as RequestHandler
);

// Create a new conversation
router.post(
  '/conversations',
  [
    body('participantIds')
      .isArray({ min: 1 })
      .withMessage('At least one participant is required')
      .custom((value: any[]) => value.every(Number.isInteger))
      .withMessage('All participant IDs must be integers'),
    body('serviceType').optional().isString().trim().notEmpty(),
    body('metadata').optional().isObject()
  ],
  chatControllerV2.createConversation as RequestHandler
);

// Send a new message
router.post(
  '/messages',
  [
    body('conversationId')
      .isInt()
      .withMessage('Conversation ID must be an integer'),
    body('message')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Message is required'),
    body('messageType')
      .optional()
      .isIn(['text', 'image', 'location', 'file'])
      .withMessage('Invalid message type'),
    body('content').optional().isObject(),
    body('parentMessageId')
      .optional()
      .isInt()
      .withMessage('Parent message ID must be an integer')
  ],
  chatControllerV2.sendMessage as RequestHandler
);

// Get messages for a conversation
router.get(
  '/conversations/:conversationId/messages',
  [
    param('conversationId').isInt().withMessage('Invalid conversation ID'),
    query('before')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format. Use ISO 8601 format'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  chatControllerV2.getMessages as RequestHandler
);

// Mark messages as read
router.post(
  '/messages/read',
  [
    body('conversationId')
      .isInt()
      .withMessage('Conversation ID must be an integer'),
    body('messageIds')
      .isArray({ min: 1 })
      .withMessage('At least one message ID is required')
      .custom((value: any[]) => value.every(Number.isInteger))
      .withMessage('All message IDs must be integers')
  ],
  chatControllerV2.markAsRead as RequestHandler
);

// Get unread message count
router.get(
  '/messages/unread-count',
  chatControllerV2.getUnreadCount as RequestHandler
);

export default router;
