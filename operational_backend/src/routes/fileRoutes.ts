import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { check } from 'express-validator';
import FileController from '../controllers/fileController';
import { authenticateToken } from '../middleware/auth';

// Helper type for controller methods
type ControllerMethod = (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;

// Helper function to wrap controller methods
const asyncHandler = (fn: ControllerMethod): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const router = Router();

/**
 * @route   GET /api/v1/files/:fileId
 * @desc    Get file information
 * @access  Private
 */
router.get(
  '/:fileId',
  [
    authenticateToken,
    check('fileId', 'File ID is required').isInt(),
  ],
  asyncHandler((req, res, next) => FileController.getFileInfo(req as any, res, next))
);

/**
 * @route   GET /api/v1/files/:fileId/download
 * @desc    Download a file
 * @access  Private
 */
router.get(
  '/:fileId/download',
  [
    authenticateToken,
    check('fileId', 'File ID is required').isInt(),
  ],
  asyncHandler((req, res, next) => FileController.downloadFile(req as any, res, next))
);

export default router;
