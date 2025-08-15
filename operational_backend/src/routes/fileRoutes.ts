import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { check } from 'express-validator';
import FileController from '../controllers/fileController.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { FileParams } from '../types/request.js';

// Helper type for controller methods
type ControllerMethod = (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;

// Helper function to wrap controller methods
const asyncHandler = (fn: ControllerMethod): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
    return; // Ensure no value is returned
  };
};

const router = Router();

// Use the existing AuthRequest type from auth middleware

/**
 * @route   GET /api/v1/files/:fileId
 * @desc    Get file information
 * @access  Private
 */
router.get(
  '/:fileId',
  [
    authenticateToken as any, // Type assertion to avoid type mismatch
    check('fileId', 'File ID is required').isInt(),
  ],
  (req: Request<FileParams>, res: Response, next: NextFunction) => {
    FileController.getFileInfo(req as unknown as AuthRequest<FileParams>, res, next).catch(next);
  }
);

/**
 * @route   GET /api/v1/files/:fileId/download
 * @desc    Download a file
 * @access  Private
 */
router.get(
  '/:fileId/download',
  [
    authenticateToken as any, // Type assertion to avoid type mismatch
    check('fileId', 'File ID is required').isInt(),
  ],
  (req: Request<FileParams>, res: Response, next: NextFunction) => {
    FileController.downloadFile(req as unknown as AuthRequest<FileParams>, res, next).catch(next);
  }
);

export default router;
