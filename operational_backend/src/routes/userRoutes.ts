import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcrypt';
import { Model, ModelStatic, Op } from 'sequelize';

// Import models and types
import models from '../models/index.js';
import { sequelize } from '../config/database.js';
const { User } = models;
import { AuthRequest, authenticateToken } from '../middleware/auth.js';

// Define User model type
interface IUserModel extends Model {
  id: number;
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  profile_photo?: string;
  avatar?: string;
  role_location_id?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Get models with proper typing
// Define options type for findByPk
interface FindByPkOptions {
  attributes?: {
    exclude?: string[];
    include?: string[];
  };
  include?: any[];
  [key: string]: any;
}

const UserModel = User as unknown as ModelStatic<IUserModel> & {
  update: (values: Partial<IUserModel>, options: { where: { id: number } }) => Promise<[number, IUserModel[]]>;
  findByPk: (id: string | number, options?: FindByPkOptions) => Promise<IUserModel | null>;
  findOne: (options: any) => Promise<IUserModel | null>;
  create: (values: any) => Promise<IUserModel>;
  findAll: (options?: any) => Promise<IUserModel[]>;
};

const router = Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, 'uploads/profiles');
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${uniqueSuffix}.${file.originalname.split('.').pop()}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const error = new Error('Not an image! Please upload an image.');
      cb(error);
    }
  }
});

// Helper function to wrap async route handlers with proper TypeScript support
type AsyncRequestHandler<P = {}, ResBody = any, ReqBody = any, ReqQuery = any> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void>;

const asyncHandler = <P = {}, ResBody = any, ReqBody = any, ReqQuery = any>(
  fn: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>
) => {
  return (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Define response type for the profile endpoint
interface ProfileResponse {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  profile_photo?: string;
  avatar?: string;
  role_location_id?: number;
  roleLocation?: any;
  emergencies?: any[];
  createdAt: string;
  updatedAt: string;
}

// Get user profile
router.get<{ userId: string }>(
  '/profile/:userId', 
  authenticateToken, 
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }
      
      const options: FindByPkOptions = {
        attributes: { exclude: ['password'] }
        // Temporarily remove includes to fix TypeScript errors
        // Will add them back once the models are properly typed
      };
      
      const user = await UserModel.findByPk(userId, options);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Cast to ProfileResponse to ensure type safety
      const response: ProfileResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        profile_photo: user.profile_photo,
        avatar: user.avatar,
        role_location_id: user.role_location_id,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      next(error);
    }
  }
);

// Define response type for the profile photo upload
interface ProfilePhotoResponse {
  success: boolean;
  message: string;
  profilePhoto?: string;
  error?: string;
}

// Update profile photo
router.post<{}, ProfilePhotoResponse>(
  '/profile-photo', 
  authenticateToken, 
  upload.single('profile_photo'), 
  async (req: AuthRequest, res: Response<ProfilePhotoResponse>, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
          error: 'No file was provided'
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          error: 'Authentication required'
        });
        return;
      }

      // Update user's profile photo in the database
      const [updatedRows] = await UserModel.update(
        { profile_photo: `/uploads/profiles/${req.file.filename}` },
        { where: { id: req.user.id } }
      );

      if (updatedRows === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Profile photo updated successfully',
        profilePhoto: `/uploads/profiles/${req.file.filename}`
      });
    } catch (error) {
      console.error('Error updating profile photo:', error);
      next(error);
    }
  }
);

// Define response type for the profile photo URL update
interface ProfilePhotoUrlResponse {
  success: boolean;
  message: string;
  profilePhoto?: string;
  error?: string;
}

// Update profile photo by URL (Firebase)
router.post<{}, ProfilePhotoUrlResponse>(
  '/profile-photo-url', 
  authenticateToken, 
  async (req: AuthRequest<{}, ProfilePhotoUrlResponse, { photoUrl: string }>, res: Response<ProfilePhotoUrlResponse>, next: NextFunction) => {
    try {
      const { photoUrl } = req.body;

      if (!photoUrl) {
        res.status(400).json({
          success: false,
          message: 'Photo URL is required',
          error: 'No photo URL provided'
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          error: 'Authentication required'
        });
        return;
      }

      // Update user's profile photo URL in the database
      const [updatedRows] = await UserModel.update(
        { profile_photo: photoUrl },
        { where: { id: req.user.id } }
      );

      if (updatedRows === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Profile photo updated successfully',
        profilePhoto: photoUrl
      });
    } catch (error) {
      console.error('Error updating profile photo URL:', error);
      next(error);
    }
  }
);

// Define response type for password update
interface PasswordUpdateResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Define request body type for password update
interface PasswordUpdateBody {
  currentPassword: string;
  newPassword: string;
}

// Update password
router.put<{}, PasswordUpdateResponse, PasswordUpdateBody>(
  '/update-password', 
  authenticateToken, 
  async (req: AuthRequest<{}, PasswordUpdateResponse, PasswordUpdateBody>, 
         res: Response<PasswordUpdateResponse>, 
         next: NextFunction) => {
    
    try {
      const { currentPassword, newPassword } = req.body;

      // Validate request body
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
          error: 'Missing required fields'
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long',
          error: 'Password too short'
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          error: 'Authentication required'
        });
        return;
      }

      // Find user and verify current password
      const user = await UserModel.findByPk(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'User not found'
        });
        return;
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
          error: 'Incorrect password'
        });
        return;
      }

      // Hash and update new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await UserModel.update(
        { password: hashedPassword },
        { where: { id: req.user.id } }
      );

      // Return success response
      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Error updating password:', error);
      next(error);
    }
  }
);

// Define response type for phone number update
interface PhoneUpdateResponse {
  success: boolean;
  message: string;
  phoneNumber?: string;
  error?: string;
  field?: string;
  code?: string;
}

// Define request body type for phone number update
interface PhoneUpdateBody {
  phoneNumber: string;
}

// Update phone number
router.put<{}, PhoneUpdateResponse, PhoneUpdateBody>(
  '/update-phone', 
  authenticateToken, 
  async (req: AuthRequest<{}, PhoneUpdateResponse, PhoneUpdateBody>, 
         res: Response<PhoneUpdateResponse>, 
         next: NextFunction) => {
    
    try {
      const { phoneNumber } = req.body;

      // Validate request body
      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          message: 'Phone number is required',
          error: 'Missing phone number',
          field: 'phone',
          code: 'MISSING_PHONE'
        });
        return;
      }

      // Clean and validate phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
          error: 'Invalid phone format',
          field: 'phone',
          code: 'INVALID_PHONE_FORMAT'
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      // Check if phone number is already in use by another user
      const existingPhone = await UserModel.findOne({
        where: {
          phone_number: cleanPhone,
          id: { [Op.ne]: req.user.id }
        }
      });

      if (existingPhone) {
        res.status(400).json({
          success: false,
          message: 'Phone number already in use',
          error: 'Phone number in use',
          field: 'phone',
          code: 'PHONE_ALREADY_IN_USE'
        });
        return;
      }

      // Update the user's phone number
      const [updatedRows] = await UserModel.update(
        { phone_number: cleanPhone },
        { where: { id: req.user.id } }
      );

      if (updatedRows === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }
      
      res.json({ 
        success: true, 
        message: 'Phone number updated successfully',
        phoneNumber: cleanPhone
      });
    } catch (error) {
      console.error('Error updating phone number:', error);
      next(error);
    }
  }
);

// Define response type for email update
interface EmailUpdateResponse {
  success: boolean;
  message: string;
  email?: string;
  error?: string;
  field?: string;
  code?: string;
}

// Define request body type for email update
interface EmailUpdateBody {
  email: string;
}

// Update email
router.put<{}, EmailUpdateResponse, EmailUpdateBody>(
  '/update-email', 
  authenticateToken, 
  async (req: AuthRequest<{}, EmailUpdateResponse, EmailUpdateBody>, 
         res: Response<EmailUpdateResponse>, 
         next: NextFunction) => {
    
    try {
      const { email } = req.body;

      // Validate request body
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
          error: 'Missing email',
          field: 'email',
          code: 'MISSING_EMAIL'
        });
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
          error: 'Invalid email format',
          field: 'email',
          code: 'INVALID_EMAIL_FORMAT'
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      // Check if email is already in use by another user
      const existingEmail = await UserModel.findOne({
        where: {
          email: email,
          id: { [Op.ne]: req.user.id }
        }
      });

      if (existingEmail) {
        res.status(400).json({
          success: false,
          message: 'Email is already in use by another account',
          error: 'Email already in use',
          field: 'email',
          code: 'EMAIL_ALREADY_IN_USE'
        });
        return;
      }

      // Update the user's email
      const [updatedRows] = await UserModel.update(
        { email: email },
        { 
          where: { id: req.user.id }
        }
      );

      if (updatedRows === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Email updated successfully',
        email: email
      });
    } catch (error) {
      console.error('Error updating email:', error);
      next(error);
    }
  }
);

export default router;
