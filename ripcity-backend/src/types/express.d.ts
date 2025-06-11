import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        email: string;
        name?: string;
        tier?: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {};
