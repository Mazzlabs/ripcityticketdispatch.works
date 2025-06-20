/**
 * RIP CITY TICKET DISPATCH - PRODUCTION SERVER
 * Full production deployment with all security features
 * CloudFlare + DigitalOcean optimized
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Database and utilities
import MongoDB from './database/connection';
import logger from './utils/logger';

// Services
import ticketmasterService from './services/ticketmaster';
import eventbriteService from './services/eventbrite';
import { DealScoringService } from './services/dealScoring';

// Routes
import userRoutes from './routes/users';
import dealRoutes from './routes/deals';
import subscriptionRoutes from './routes/subscriptions';
import smsConsentRoutes from './routes/smsConsent';

// Middleware
import { authenticateToken, requireSubscription } from './middleware/auth';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Initialize services
const dealScoringService = new DealScoringService();

// Production Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.mixpanel.com", "https://www.google-analytics.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Strict Rate Limiting for Production
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', strictLimiter);

// CORS for production domains only
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'https://ripcityticketdispatch.works',
    'https://mazzlabs.works'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing with limits
app.use(compression());
app.use(express.json({ limit: '5mb' })); // Smaller limit for production
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await MongoDB.healthCheck();
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
        premium: true,
        historicalData: {
          averagePrice: deal.originalPrice * 1.1,
          priceHistory: [], // Would come from database
          trendAnalysis: 'stable'
        },
        advancedMetrics: {
          popularityScore: Math.floor(Math.random() * 100),
          demandLevel: 'high',
          priceVolatility: 'low'
        }
      }));
    
    res.json({
      success: true,
      deals: premiumDeals,
      metadata: {
        total: premiumDeals.length,
        userTier: req.user?.tier,
        timestamp: new Date().toISOString()
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
    await MongoDB.connect();
    logger.info('🗄️ Database connection established');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await MongoDB.disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await MongoDB.disconnect();
    process.exit(0);
  });
});

export default app;
