import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

interface ErrorResponse {
  success: boolean;
  errors: Array<{
    param: string;
    message: string;
    location?: string;
  }>;
}

/**
 * Middleware to validate request using express-validator
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const validateRequest = (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array().map((err) => {
        // Type assertion to access the properties we know exist
        const error = err as unknown as {
          path?: string;
          msg: string;
          location?: string;
          type?: string;
        };
        
        return {
          param: error.path || 'unknown',
          message: error.msg,
          location: error.location,
          type: error.type
        };
      })
    });
  }
  next();
};

export { validateRequest };

export default validateRequest;
