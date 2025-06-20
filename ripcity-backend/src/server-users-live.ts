/**
 * RIP CITY TICKET DISPATCH - User Management Server
 * Dedicated server for user authentication and profile management
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import logger from './utils/logger';
import MongoDB from './database/connection';
import userRoutes from './routes/users';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8084', 10);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: [
    'https://ripcityticketdispatch.works',
    'https://mazzlabs.works',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Rate limiting - stricter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit auth attempts
  message: 'Too many authentication attempts'
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests'
});

app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/users/forgot-password', authLimiter);
app.use(generalLimiter);

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await MongoDB.healthCheck();
    const jwtConfigured = !!process.env.JWT_SECRET;
    
    res.json({
      service: 'user-management',
      status: 'healthy',
      database: dbHealth ? 'connected' : 'disconnected',
      jwt_configured: jwtConfigured,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      service: 'user-management',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// User management endpoints
app.use('/api/users', userRoutes);

// Protected user profile endpoint
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    res.json({
      success: true,
      service: 'user-management',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier || 'free'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      service: 'user-management',
      error: 'Failed to fetch user profile'
    });
  }
});

// User preferences endpoint
app.get('/api/preferences', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // TODO: Fetch user preferences from database
    const preferences = {
      notifications: true,
      emailAlerts: true,
      smsAlerts: false, // MVP - SMS disabled
      categories: ['NBA', 'MLS', 'Music'],
      priceThreshold: 100
    };

    res.json({
      success: true,
      service: 'user-management',
      preferences,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Preferences fetch error:', error);
    res.status(500).json({
      success: false,
      service: 'user-management',
      error: 'Failed to fetch user preferences'
    });
  }
});

// Update preferences endpoint
app.put('/api/preferences', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { notifications, emailAlerts, categories, priceThreshold } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // TODO: Update user preferences in database
    logger.info('Updating user preferences', { 
      userId: user.id, 
      preferences: { notifications, emailAlerts, categories, priceThreshold }
    });

    res.json({
      success: true,
      service: 'user-management',
      message: 'Preferences updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Preferences update error:', error);
    res.status(500).json({
      success: false,
      service: 'user-management',
      error: 'Failed to update preferences'
    });
  }
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('User management service error:', error);
  res.status(500).json({
    success: false,
    service: 'user-management',
    error: 'Internal user management service error'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`👤 User Management Service running on port ${PORT}`);
  logger.info(`🔐 JWT: ${process.env.JWT_SECRET ? 'CONFIGURED' : 'MISSING'}`);
  
  try {
    await MongoDB.connect();
    logger.info('🗄️ Database connected');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down User Management service');
  server.close(async () => {
    await MongoDB.disconnect();
    process.exit(0);
  });
});

export default app;
