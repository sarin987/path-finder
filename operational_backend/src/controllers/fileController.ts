import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { File } from '../models/File';
import { AuthRequest } from '../middleware/authMiddleware'; // Import AuthRequest type

// Helper function to handle responses
const sendResponse = (res: Response, status: number, data: any) => {
  return res.status(status).json(data);
};

// Helper function to handle errors
const handleError = (res: Response, status: number, message: string) => {
  return res.status(status).json({ message });
};

class FileController {
  /**
   * Download a file
   */
  static async downloadFile(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    if (!req.user) {
      handleError(res, 401, 'Unauthorized');
      return;
    }
    try {
      const { fileId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const file = await File.findByPk(fileId);

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Check if user has access to this file
      if (file.created_by !== userId) {
        // Check if user is a participant in the conversation
        const message = await file.chatMessage;
        if (!message) {
          handleError(res, 403, 'Access denied - message not found');
          return;
        }
        
        // Load conversation with participants
        const conversation = await (message as any).getConversation();
        if (!conversation || !conversation.participant_ids.includes(userId)) {
          handleError(res, 403, 'Access denied - not a participant');
          return;
        }
      }

      const filePath = path.join(__dirname, '../../uploads', file.storage_path);

      if (!fs.existsSync(filePath)) {
        handleError(res, 404, 'File not found');
        return;
      }

      // Set appropriate headers
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.setHeader('Content-Length', file.size.toString());

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file' });
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get file info
   */
  static async getFileInfo(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    if (!req.user) {
      handleError(res, 401, 'Unauthorized');
      return;
    }
    try {
      const { fileId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const file = await File.findByPk(fileId, {
        include: [
          {
            association: 'chatMessage',
            attributes: ['conversation_id'],
            include: [
              {
                association: 'conversation',
                attributes: ['participant_ids'],
              },
            ],
          },
        ],
      });

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Check if user has access to this file
      if (file.created_by !== userId) {
        // Check if user is a participant in the conversation
        const conversation = file.chatMessage?.conversation;
        if (!conversation || !conversation.participant_ids.includes(userId)) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.storage_path}`;

      sendResponse(res, 200, {
        id: file.id,
        originalName: file.original_name,
        mimeType: file.mime_type,
        size: file.size,
        type: file.type,
        url: fileUrl,
        createdAt: file.created_at,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default FileController;
