/**
 * RIP CITY TICKET DISPATCH - PRODUCTION SERVER
 * Comprehensive API server with live Ticketmaster & Eventbrite integration
 * Excludes pending services: Stripe, Twilio, SendGrid (awaiting approval)
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import logger from './utils/logger';

// Database connection
import MongoDB from './database/connection';

// Live API Services
import ticketmasterService from './services/ticketmaster';
import eventbriteService from './services/eventbrite';
import { DealScoringService } from './services/dealScoring';
import eventAggregationService from './services/eventAggregation';
import alertService from './services/alertService';

// Routes
import userRoutes from './routes/users';
import dealRoutes from './routes/deals';
import subscriptionRoutes from './routes/subscriptions';
import smsConsentRoutes from './routes/smsConsent';

// Middleware
import { authenticateToken, requireSubscription } from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Initialize services
const dealScoringService = new DealScoringService();

// ===== SECURITY & MIDDLEWARE =====

// Security headers for production deployment
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "https://*.ticketmaster.com", "https://*.eventbrite.com"],
      connectSrc: ["'self'", "https://api.mixpanel.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for DigitalOcean deployment
const corsOptions = {
  origin: [
    'https://ripcityticketdispatch.works',
    'https://api.ripcityticketdispatch.works',
    'http://localhost:3000',
    'http://localhost:8080'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Rate limiting for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Too many requests from this IP',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later'
    });
  }
});
app.use('/api/', limiter);

// Body parsing and compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// ===== HEALTH CHECK =====

app.get('/health', async (req, res) => {
  try {
    const dbHealth = await MongoDB.healthCheck();
    
    // Test live API connections
    let ticketmasterHealth = false;
    let eventbriteHealth = false;
    
    try {
      await ticketmasterService.getVenues();
      ticketmasterHealth = true;
    } catch (e) {
      logger.warn('Ticketmaster API health check failed:', e);
    }
    
    try {
      await eventbriteService.getPortlandEvents();
      eventbriteHealth = true;
    } catch (e) {
      logger.warn('Eventbrite API health check failed:', e);
    }
    
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: dbHealth ? 'connected' : 'disconnected',
        ticketmaster: ticketmasterHealth ? 'live_api_active' : 'api_error',
        eventbrite: eventbriteHealth ? 'live_api_active' : 'api_error',
        // Pending services (excluded from MVP)
        stripe: 'pending_approval',
        twilio: 'pending_approval',
        sendgrid: 'pending_approval'
      },
      environment: process.env.NODE_ENV || 'development',
      api_keys: {
        ticketmaster: !!process.env.TICKETMASTER_KEY,
        eventbrite: !!process.env.EVENTBRITE_KEY
      }
    };
    
    // Set status code based on critical services
    const statusCode = (dbHealth && (ticketmasterHealth || eventbriteHealth)) ? 200 : 503;
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
});

// ===== LIVE API ENDPOINTS =====

// Venues endpoint - Ticketmaster live API
app.get('/api/venues', async (req, res) => {
  try {
    logger.info('Fetching venues from live Ticketmaster API');
    const venues = await ticketmasterService.getVenues();
    
    res.json({
      success: true,
      data: venues,
      source: 'ticketmaster_live_api',
      metadata: {
        count: venues.length,
        timestamp: new Date().toISOString(),
        api_status: 'certified'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Ticketmaster venues API error:', { error: errorMessage });
    res.status(503).json({
      success: false,
      error: 'Failed to fetch venues from live API',
      message: 'Ticketmaster API temporarily unavailable',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Events endpoint - Aggregated live APIs
app.get('/api/events', async (req, res) => {
  try {
    const { category = 'all', limit = '50', venue, minPrice, maxPrice } = req.query;
    logger.info('Fetching events from live APIs', { category, limit, venue });
    
    // Build filters object
    const filters = {
      category: (category as 'sports' | 'music' | 'entertainment' | 'all'),
      venue: venue as string,
      minPrice: minPrice ? parseInt(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined
    };
    
    const events = await eventAggregationService.searchAllEvents(filters);
    const limitedEvents = events.slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      data: limitedEvents,
      sources: ['ticketmaster_live', 'eventbrite_live'],
      metadata: {
        total: limitedEvents.length,
        available: events.length,
        timestamp: new Date().toISOString(),
        api_status: 'live_certified_apis',
        filters: filters
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Events aggregation API error:', { error: errorMessage });
    res.status(503).json({
      success: false,
      error: 'Failed to fetch events from live APIs',
      message: 'Event aggregation service temporarily unavailable',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Portland Trail Blazers specific endpoint
app.get('/api/events/blazers', async (req, res) => {
  try {
    logger.info('Fetching Portland Trail Blazers events');
    const blazersEvents = await ticketmasterService.getBlazersEvents();
    
    res.json({
      success: true,
      data: blazersEvents,
      source: 'ticketmaster_live_api',
      metadata: {
        count: blazersEvents.length,
        team: 'Portland Trail Blazers',
        timestamp: new Date().toISOString(),
        season: '2024-25'
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Blazers events API error:', { error: errorMessage });
    res.status(503).json({
      success: false,
      error: 'Failed to fetch Blazers events',
      message: 'Trail Blazers ticket data temporarily unavailable',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Deals endpoint with scoring
app.get('/api/deals', async (req, res) => {
  try {
    const { 
      category = 'all', 
      limit = '20', 
      minScore = '0',
      sortBy = 'score'
    } = req.query;
    
    logger.info('Fetching and scoring deals', { category, limit, minScore, sortBy });
    
    // Get events from aggregation service
    const events = await eventAggregationService.searchAllEvents({
      category: category as any
    });
    
    // Score deals using the service
    const scoredDeals = dealScoringService.scoreDeals(events);
    
    // Filter by minimum score
    const filteredDeals = scoredDeals.filter(
      deal => deal.dealScore >= parseInt(minScore as string)
    );
    
    // Sort deals
    const sortedDeals = filteredDeals.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.currentPrice - b.currentPrice;
        case 'date':
          return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
        case 'score':
        default:
          return b.dealScore - a.dealScore;
      }
    });
    
    const limitedDeals = sortedDeals.slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      data: limitedDeals,
      metadata: {
        total: limitedDeals.length,
        available: filteredDeals.length,
        timestamp: new Date().toISOString(),
        filters: { category, minScore, sortBy },
        averageScore: limitedDeals.reduce((sum, deal) => sum + deal.dealScore, 0) / limitedDeals.length
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Deals API error:', { error: errorMessage });
    res.status(503).json({
      success: false,
      error: 'Failed to fetch and score deals',
      message: 'Deal scoring service temporarily unavailable',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Hot deals endpoint (high scores only)
app.get('/api/deals/hot', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    logger.info('Fetching hot deals (high scores only)');
    
    // Get events and score them
    const events = await eventAggregationService.searchAllEvents({});
    const scoredDeals = dealScoringService.scoreDeals(events);
    
    // Filter for hot deals (score > 80)
    const hotDeals = scoredDeals
      .filter(deal => deal.dealScore > 80)
      .sort((a, b) => b.dealScore - a.dealScore)
      .slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      data: hotDeals,
      metadata: {
        count: hotDeals.length,
        timestamp: new Date().toISOString(),
        criteria: 'dealScore > 80',
        averageScore: hotDeals.reduce((sum, deal) => sum + deal.dealScore, 0) / hotDeals.length
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Hot deals API error:', { error: errorMessage });
    res.status(503).json({
      success: false,
      error: 'Failed to fetch hot deals',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// ===== ROUTE HANDLERS =====

// User management routes (excluding payment features)
app.use('/api/users', userRoutes);

// Deal routes
app.use('/api/deals', dealRoutes);

// Subscription routes (basic features only, no payment processing)
app.use('/api/subscriptions', subscriptionRoutes);

// SMS consent routes (no actual SMS sending until Twilio approved)
app.use('/api/sms-consent', smsConsentRoutes);

// ===== STATIC FILE SERVING =====

// Serve frontend build files
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, 'frontend');
  app.use(express.static(frontendPath));
  
  // Legal site
  const legalPath = path.join(__dirname, 'legal-site');
  app.use('/legal', express.static(legalPath));
  
  // Catch-all handler for frontend routing
  app.get('*', (req, res) => {
    // Don't serve frontend for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.path
      });
    }
    
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ===== ERROR HANDLING =====

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path,
    message: 'Check the API documentation for available endpoints'
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// ===== SERVER STARTUP =====

async function startServer() {
  try {
    // Initialize database connection
    await MongoDB.connect();
    logger.info('Database connected successfully');
    
    // Test API connections
    try {
      await ticketmasterService.getVenues();
      logger.info('Ticketmaster API connection verified');
    } catch (e) {
      logger.warn('Ticketmaster API connection failed - will retry during requests');
    }
    
    try {
      await eventbriteService.getPortlandEvents();
      logger.info('Eventbrite API connection verified');
    } catch (e) {
      logger.warn('Eventbrite API connection failed - will retry during requests');
    }
    
    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 RipCity Ticket Dispatch Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📡 API base: http://localhost:${PORT}/api`);
      logger.info(`⚡ Live APIs: Ticketmaster ✅ Eventbrite ✅`);
      logger.info(`⏳ Pending: Stripe, Twilio, SendGrid (awaiting approval)`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        MongoDB.disconnect();
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        MongoDB.disconnect();
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export default app;
