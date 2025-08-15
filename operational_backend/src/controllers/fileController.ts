import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

interface FileParams extends ParamsDictionary {
  fileId: string;
}
import path from 'path';
import fs from 'fs';
import File from '../models/File.js';
import { AuthRequest } from '../middleware/auth.js'; // Import AuthRequest type

// Helper function to handle responses
const sendResponse = (res: Response, status: number, data: any): void => {
  res.status(status).json(data);
};

// Helper function to handle errors
const handleError = (res: Response, status: number, message: string): void => {
  res.status(status).json({ message });
};

class FileController {
  /**
   * Download a file
   */
  static async downloadFile(req: AuthRequest<FileParams>, res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
      handleError(res, 401, 'Unauthorized');
      return;
    }
    try {
      const { fileId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        handleError(res, 401, 'Unauthorized');
        return;
      }

      const file = await File.findByPk(fileId);

      if (!file) {
        handleError(res, 404, 'File not found');
        return;
      }

      // Check if user has access to this file
      if (file.created_by !== userId) {
        handleError(res, 403, 'Access denied');
        return;
      }

      const filePath = path.join(__dirname, '../../uploads', file.storage_path);

      if (!fs.existsSync(filePath)) {
        handleError(res, 404, 'File not found');
        return;
      }

      // Set appropriate headers before starting the stream
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.setHeader('Content-Length', file.size.toString());

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      
      // Handle stream errors
      fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file' });
        } else {
          // If headers are already sent, we can't send JSON, so end the response
          res.end();
        }
      });
      
      // Handle client disconnection
      req.on('close', () => {
        fileStream.destroy();
      });
      
      // Pipe the file to the response
      fileStream.pipe(res);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get file info
   */
  static async getFileInfo(req: AuthRequest<FileParams>, res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
      handleError(res, 401, 'Unauthorized');
      return;
    }
    try {
      const { fileId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        handleError(res, 401, 'Unauthorized');
        return;
      }

      const file = await File.findByPk(fileId);

      if (!file) {
        handleError(res, 404, 'File not found');
        return;
      }

      // Check if user has access to this file
      if (file.created_by !== userId) {
        handleError(res, 403, 'Access denied');
        return;
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.storage_path}`;
      
      // Return file info using sendResponse helper
      sendResponse(res, 200, {
        id: file.id,
        original_name: file.original_name,
        mime_type: file.mime_type,
        size: file.size,
        url: fileUrl,
        created_at: file.created_at,
        updated_at: file.updated_at
      });
    } catch (error) {
      next(error);
    }
  }
}

export default FileController;
