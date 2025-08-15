import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import { type AuthRequest } from '../middleware/auth.js';

type ExpressRequest = Request & AuthRequest;

/**
 * Wraps an async route handler to properly catch and forward errors to Express's error handling middleware
 * @param fn The async route handler function
 * @returns A new request handler that properly handles async/await functions
 */
export function asyncHandler(
  fn: (req: ExpressRequest, res: Response, next: NextFunction) => Promise<void | Response>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Execute the handler and catch any errors
    Promise.resolve(fn(req as ExpressRequest, res, next)).catch(next);
  };
}
