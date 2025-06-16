/**
 * RIP CITY TICKET DISPATCH - Minimal Deployment Server
 * For MongoDB connection testing and basic deployment validation
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import winston from 'winston';
import db from './database/connection';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Basic middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    'https://ripcityticketdispatch.works',
    'https://mazzlabs.works',
    'http://localhost:3000'
  ]
}));
app.use(express.json());

// Health check with database status
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    res.json({ 
      status: 'healthy', 
      database: dbHealth ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const isConnected = db.isConnectedStatus();
    const users = await db.getUsers();
    
    res.json({
      connected: isConnected,
      userCount: users.length,
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Database test failed:', error);
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Basic user creation test
app.post('/api/test-user', async (req, res) => {
  try {
    const testUser = {
      email: `test-${Date.now()}@ripcityticketdispatch.works`,
      password: 'test123',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = await db.createUser(testUser);
    
    res.json({
      success: true,
      userId: user._id,
      email: user.email,
      message: 'Test user created successfully'
    });
  } catch (error) {
    logger.error('Test user creation failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Catch-all for undefined routes
app.get('*', (req, res) => {
  res.json({
    message: 'RIP City Ticket Dispatch - Minimal Deployment Server',
    endpoints: [
      'GET /health - Health check',
      'GET /api/test-db - Database connection test',
      'POST /api/test-user - Create test user'
    ],
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await db.connect();
    logger.info('✅ MongoDB connected successfully');

    // Start Express server
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Minimal deployment server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🍃 Database: MongoDB`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  try {
    await db.disconnect();
    logger.info('Database disconnected');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  try {
    await db.disconnect();
    logger.info('Database disconnected');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();
