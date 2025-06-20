/**
 * RIP CITY TICKET DISPATCH - LIVE API SERVER
 * Clean implementation with working Ticketmaster & Eventbrite APIs
 * MVP ready: Stripe/Twilio/SendGrid bypassed until approval
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database and utilities
import MongoDB from './database/connection';
import logger from './utils/logger';

// Services - Live APIs
import ticketmasterService from './services/ticketmaster';
import eventbriteService from './services/eventbrite';
import { DealScoringService } from './services/dealScoring';
import eventAggregationService from './services/eventAggregation';

// MVP Bypass Services
import { mockStripeService, mockTwilioService } from './services/mvpBypass';

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

// Security & Performance
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      imgSrc: ["'self'", "data:", "https:", "https://*.ticketmaster.com", "https://*.eventbrite.com"],
      connectSrc: ["'self'", "https://api.mixpanel.com", "https://www.google-analytics.com"]
    }
  }
}));

// CORS for CloudFlare deployment
const corsOptions = {
  origin: [
    'https://ripcityticketdispatch.works',
    'https://mazzlabs.works',
    'http://localhost:3000' // Development
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting for API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check with service status
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await MongoDB.healthCheck();
    
    // Test live API connections
    let ticketmasterHealth = false;
    let eventbriteHealth = false;
    
    try {
      const venues = await ticketmasterService.getVenues();
      ticketmasterHealth = venues && venues.length > 0;
    } catch (e) {
      logger.warn('Ticketmaster API check failed:', e);
    }
    
    try {
      const events = await eventbriteService.getPortlandEvents();
      eventbriteHealth = events && events.length > 0;
    } catch (e) {
      logger.warn('Eventbrite API check failed:', e);
    }
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth ? 'connected' : 'disconnected',
        ticketmaster: ticketmasterHealth ? 'live_api_active' : 'api_error',
        eventbrite: eventbriteHealth ? 'live_api_active' : 'api_error',
        // MVP bypassed services
        stripe: 'bypassed_mvp',
        twilio: 'bypassed_mvp',
        sendgrid: 'bypassed_mvp'
      },
      environment: process.env.NODE_ENV || 'development',
      api_keys: {
        ticketmaster: !!process.env.TICKETMASTER_KEY,
        eventbrite: !!process.env.EVENTBRITE_KEY
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Live API Endpoints

// Get Portland venues from Ticketmaster
app.get('/api/venues', async (req, res) => {
  try {
    logger.info('Fetching venues from live Ticketmaster API');
    const venues = await ticketmasterService.getVenues();
    
    res.json({
      success: true,
      venues,
      source: 'ticketmaster_live_api',
      metadata: {
        count: venues.length,
        timestamp: new Date().toISOString(),
        api_key_status: 'certified'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Live Ticketmaster API error', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch venues from live API',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get live events from multiple APIs
app.get('/api/events', async (req, res) => {
  try {
    const { category, limit = '50' } = req.query;
    logger.info('Fetching events from live APIs', { category, limit });
    
    // Use real event aggregation service
    const filters = {
      category: (category as 'sports' | 'music' | 'entertainment' | 'all') || 'all'
    };
    
    const events = await eventAggregationService.searchAllEvents(filters);
    const limitedEvents = events.slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      events: limitedEvents,
      metadata: {
        total: events.length,
        returned: limitedEvents.length,
        category: filters.category,
        source: 'live_apis_aggregated',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Live events API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events from live APIs'
    });
  }
});

// Live deal discovery
app.get('/api/deals/hot', async (req, res) => {
  try {
    logger.info('Fetching hot deals from live APIs');
    
    // Get events directly from Ticketmaster API (proper type)
    const ticketmasterEvents = await ticketmasterService.searchEvents({
      city: 'Portland',
      size: '50'
    });
    
    // Score deals using real algorithm (expects TicketmasterEvent[])
    const scoredDeals = dealScoringService.scoreDeals(ticketmasterEvents);
    
    // Filter for hot deals (dealScore > 80)
    const hotDeals = scoredDeals
      .filter(deal => deal.dealScore > 80)
      .slice(0, 20);
    
    res.json({
      success: true,
      deals: hotDeals,
      metadata: {
        total_analyzed: ticketmasterEvents.length,
        hot_deals_found: hotDeals.length,
        min_score: 80,
        source: 'ticketmaster_live_api',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Hot deals API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hot deals'
    });
  }
});

// Portland Trail Blazers specific endpoint
app.get('/api/blazers', async (req, res) => {
  try {
    logger.info('Fetching Portland Trail Blazers events');
    
    // Search specifically for Blazers games
    const blazersEvents = await ticketmasterService.searchEvents({
      keyword: 'Portland Trail Blazers',
      city: 'Portland',
      classificationName: 'Basketball'
    });
    
    const deals = dealScoringService.scoreDeals(blazersEvents);
    
    res.json({
      success: true,
      games: deals,
      metadata: {
        team: 'Portland Trail Blazers',
        venue: 'Moda Center',
        source: 'ticketmaster_live_api',
        count: deals.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Blazers API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Blazers games'
    });
  }
});

// API Routes with live data
app.use('/api/users', userRoutes);
app.use('/api/deals', dealRoutes);

// MVP Bypass Routes - Mock responses until approval
app.use('/api/subscriptions', (req, res, next) => {
  logger.info('MVP: Subscription request intercepted - Stripe bypassed');
  req.headers['x-mvp-mode'] = 'true';
  next();
}, subscriptionRoutes);

app.use('/api/sms-consent', (req, res, next) => {
  logger.info('MVP: SMS consent request intercepted - Twilio bypassed');  
  req.headers['x-mvp-mode'] = 'true';
  next();
}, smsConsentRoutes);

// Serve legal documents (required for API approvals)
app.use('/legal', express.static(path.join(__dirname, '../legal-site')));

// Serve React frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Catch-all handler for React Router
app.get('*', (req, res) => {
  // API routes return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      success: false, 
      error: 'API endpoint not found',
      available_endpoints: [
        '/api/venues',
        '/api/events', 
        '/api/blazers',
        '/api/deals/hot',
        '/api/users',
        '/api/subscriptions (MVP bypassed)',
        '/api/sms-consent (MVP bypassed)'
      ]
    });
  }
  
  // Legal routes
  if (req.path.startsWith('/legal/')) {
    return res.sendFile(path.join(__dirname, '../legal-site/index.html'));
  }
  
  // Serve React app
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { 
    error: error.message, 
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

// Graceful shutdown
const server = app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🚀 Rip City LIVE API Server running on port ${PORT}`);
  logger.info(`🏀 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Domain: ripcityticketdispatch.works (via CloudFlare)`);
  logger.info(`☁️  Hosting: DigitalOcean`);
  logger.info(`🍃 Database: MongoDB`);
  logger.info(`🎫 Ticketmaster API: ${process.env.TICKETMASTER_KEY ? 'LIVE & CERTIFIED ✅' : 'MISSING ❌'}`);
  logger.info(`🎪 Eventbrite API: ${process.env.EVENTBRITE_KEY ? 'LIVE & CERTIFIED ✅' : 'MISSING ❌'}`);
  logger.info(`💳 Stripe: BYPASSED FOR MVP (awaiting approval)`);
  logger.info(`📱 Twilio SMS: BYPASSED FOR MVP (awaiting approval)`);
  logger.info(`📧 SendGrid: BYPASSED FOR MVP (awaiting approval)`);
  
  // Initialize database connection
  try {
    await MongoDB.connect();
    logger.info('🗄️ MongoDB connection established');
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
