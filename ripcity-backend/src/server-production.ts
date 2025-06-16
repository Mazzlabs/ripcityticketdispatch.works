/**
 * RIP CITY TICKET DISPATCH - Production Server
 * Portland's Premier Event Ticket Hub - Sports, Music, Entertainment
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables first
dotenv.config();

// Import services
import ticketmasterService from './services/ticketmaster';
import eventbriteService from './services/eventbrite';
import db from './database/connection';
import { DealScoringService } from './services/dealScoring';

// Import routes
import userRoutes from './routes/users';
import dealRoutes from './routes/deals';
import paymentRoutes from './routes/payments';
import subscriptionRoutes from './routes/subscriptions';
import smsConsentRoutes from './routes/smsConsent';

// Import middleware
import { authenticateToken, requireSubscription } from './middleware/auth';

// Extend Express Request type
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

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Initialize services
const dealScoringService = new DealScoringService();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.mixpanel.com", "https://www.google-analytics.com"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '100'),
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'https://ripcityticketdispatch.works',
    'https://legal.ripcityticketdispatch.works',
    'https://mazzlabs.works',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Basic middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    const services = {
      database: dbHealth ? 'connected' : 'disconnected',
      ticketmaster: !!process.env.TICKETMASTER_KEY,
      eventbrite: !!process.env.EVENTBRITE_KEY,
      stripe: !!process.env.STRIPE_SECRET,
      twilio: !!process.env.TWILIO_ACCOUNT_SID,
      sendgrid: !!process.env.SENDGRID_API_KEY
    };

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services,
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service health check failed'
    });
  }
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/sms-consent', smsConsentRoutes);

// Venues endpoint
app.get('/api/venues', async (req, res) => {
  try {
    logger.info('Fetching Portland venues');
    
    const venues = await ticketmasterService.getVenues();
    
    res.json({
      success: true,
      venues,
      metadata: {
        count: venues.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching venues', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch venues'
    });
  }
});

// Premium API endpoint - requires subscription
app.get('/api/premium/deals', authenticateToken, requireSubscription('premium'), async (req, res) => {
  try {
    const { city = 'portland', category, minPrice, maxPrice, limit = 50 } = req.query;
    
    logger.info('Fetching premium deals', { 
      city, 
      category, 
      minPrice, 
      maxPrice, 
      userId: req.user?.id,
      tier: req.user?.tier 
    });
    
    const events = await ticketmasterService.searchEvents({
      city: city as string,
      classificationName: category as string,
      minPrice: minPrice as string,
      maxPrice: maxPrice as string
    });
    
    const deals = dealScoringService.scoreDeals(events);
    
    // Premium features: more deals, historical data, advanced filtering
    const premiumDeals = deals
      .slice(0, parseInt(limit as string))
      .map(deal => ({
        ...deal,
        priceHistory: [], // TODO: Add actual price history when data service is ready
        demandLevel: Math.random() > 0.5 ? 'high' : 'normal', // TODO: Calculate actual demand
        similarEvents: [], // TODO: Add similar events
        premiumInsights: {
          recommendedAction: deal.dealScore > 80 ? 'buy_now' : deal.dealScore > 60 ? 'watch' : 'wait',
          priceDropProbability: Math.round(Math.random() * 100),
          bestPurchaseTime: '2-3 days before event'
        }
      }));
    
    res.json({
      success: true,
      deals: premiumDeals,
      premiumFeatures: true,
      metadata: {
        count: premiumDeals.length,
        timestamp: new Date().toISOString(),
        userTier: req.user?.tier
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching premium deals', { error: errorMessage, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch premium deals'
    });
  }
});

// Serve legal documents (critical for API approvals)
app.use('/legal', express.static(path.join(__dirname, '..', '..', 'legal-site')));

// Serve React frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Catch-all handler for React Router
app.get('*', (req, res) => {
  // If it's an API route, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      success: false,
      error: 'API endpoint not found' 
    });
  }
  
  // For legal routes, serve legal site
  if (req.path.startsWith('/legal/')) {
    return res.sendFile(path.join(__dirname, '..', '..', 'legal-site', 'index.html'));
  }
  
  // Otherwise serve React app
  const frontendPath = path.join(__dirname, 'frontend', 'index.html');
  if (require('fs').existsSync(frontendPath)) {
    res.sendFile(frontendPath);
  } else {
    res.status(404).json({
      success: false,
      error: 'Frontend not found - build the React app first'
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Graceful shutdown handling
const server = app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🚀 Rip City Events Hub running on port ${PORT}`);
  logger.info(`🏀 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌹 Portland Event Ticket Discovery Platform`);
  logger.info(`🔑 Ticketmaster API: ${process.env.TICKETMASTER_KEY ? 'Configured' : 'Missing'}`);
  logger.info(`🎫 Eventbrite API: ${process.env.EVENTBRITE_KEY ? 'Configured' : 'Missing'}`);
  logger.info(`💳 Stripe: ${process.env.STRIPE_SECRET ? 'Configured' : 'Pending Approval'}`);
  logger.info(`📱 Twilio SMS: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Pending Approval'}`);
  logger.info(`📧 SendGrid: ${process.env.SENDGRID_API_KEY ? 'Configured' : 'Pending Approval'}`);
  
  // Initialize database
  try {
    await db.connect();
    logger.info('🗄️ MongoDB connection established');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    logger.error('Server will continue but functionality will be limited');
  }
});

// Handle graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  server.close(async () => {
    try {
      await db.disconnect();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database:', error);
    }
    
    logger.info('Rip City Events Hub shutdown complete');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
