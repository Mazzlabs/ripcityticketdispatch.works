import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    tier?: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret';

  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) {
      logger.warn('Invalid token', { error: err.message });
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
};

export const requireSubscription = (minimumTier: 'pro' | 'premium' | 'enterprise') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userTier = req.user?.tier || 'free';
    
    const tierHierarchy = ['free', 'pro', 'premium', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const requiredTierIndex = tierHierarchy.indexOf(minimumTier);
    
    if (userTierIndex < requiredTierIndex) {
      return res.status(402).json({
        success: false,
        error: `This feature requires ${minimumTier} subscription or higher`,
        currentTier: userTier,
        requiredTier: minimumTier
      });
    }
    
    next();
  };
};
