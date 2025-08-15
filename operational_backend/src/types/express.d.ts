import { Request } from 'express';

declare global {
  namespace Express {
    interface RequestUser {
      id: number;
      name: string;
      email: string;
      role: string;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
      [key: string]: any;
    }

    interface Request {
      user?: RequestUser;
    }
  }
}
