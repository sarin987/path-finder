import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import type { Request } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'video/mp4',
    'video/quicktime',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, audio, and video are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Middleware for handling file uploads
const uploadFile = upload.single('file');

// Get file type from mime type
const getFileType = (mimeType: string): 'image' | 'audio' | 'video' | 'file' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return 'file';
};

// Generate file URL
const generateFileUrl = (req: Request, filename: string): string => {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

export { 
  upload, 
  uploadFile, 
  getFileType, 
  generateFileUrl 
};
