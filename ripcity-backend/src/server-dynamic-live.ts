/**
 * RIP CITY TICKET DISPATCH - DYNAMIC LIVE API SERVER
 * Real-time event aggregation using certified Ticketmaster & Eventbrite APIs
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

// LIVE API Services - Your certified APIs
import ticketmasterService from './services/ticketmaster';
import eventbriteService from './services/eventbrite';
import { DealScoringService } from './services/dealScoring';
import eventAggregationService from './services/eventAggregation';

// Routes
import userRoutes from './routes/users';
import dealRoutes from './routes/deals';
import subscriptionRoutes from './routes/subscriptions';
import smsConsentRoutes from './routes/smsConsent';

// Middleware
import { authenticateToken, requireSubscription } from './middleware/auth';

// MVP Bypass Services
import { mockStripeService, mockTwilioService, mvpStatus } from './services/mvpBypass';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Initialize services
const dealScoringService = new DealScoringService();

// Security middleware for Cloudflare deployment
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

// CORS configuration for Cloudflare deployment
const corsOptions = {
  origin: [
    'https://ripcityticketdispatch.works',
    'https://mazzlabs.works',
    'https://mazzlabs.me',
    'http://localhost:3000' // For development
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting (important for live APIs)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check with live API status
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
      logger.warn('Ticketmaster API check failed:', e);
    }
    
    try {
      await eventbriteService.getPortlandEvents();
      eventbriteHealth = true;
    } catch (e) {
      logger.warn('Eventbrite API check failed:', e);
    }
    
    res.json({
      status: 'ok',
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

// Live API endpoints using your certified APIs
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

// Dynamic events endpoint - real API aggregation
app.get('/api/events', async (req, res) => {
  try {
    const { category, limit = '50' } = req.query;
    logger.info('Fetching events from live APIs', { category, limit });
    
    // Use real event aggregation service with proper filter types
    const filters = {
      category: (category as 'sports' | 'music' | 'entertainment' | 'all') || 'all'
    };
    
    const events = await eventAggregationService.searchAllEvents(filters);
    
    // Limit results after fetching
    const limitedEvents = events.slice(0, parseInt(limit as string || '50'));
    
    res.json({
      success: true,
      events: limitedEvents,
      sources: ['ticketmaster_live', 'eventbrite_live'],
      metadata: {
        total: limitedEvents.length,
        timestamp: new Date().toISOString(),
        api_status: 'live_certified_apis',
        category_filter: category || 'all'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Live API aggregation error', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events from live APIs',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Blazers-specific endpoint using live APIs
app.get('/api/blazers', async (req, res) => {
  try {
    logger.info('Fetching Trail Blazers events from live API');
    const blazersEvents = await ticketmasterService.getBlazersEvents();
    
    res.json({
      success: true,
      events: blazersEvents,
      source: 'ticketmaster_live_api',
      metadata: {
        count: blazersEvents.length,
        timestamp: new Date().toISOString(),
        team: 'Portland Trail Blazers'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Blazers API error', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Blazers events'
    });
  }
});

// Hot deals using live data and real scoring
app.get('/api/deals/hot', async (req, res) => {
  try {
    logger.info('Generating hot deals from live API data');
    const hotDeals = await eventAggregationService.getHotDeals(20);
    
    res.json({
      success: true,
      deals: hotDeals,
      source: 'live_api_aggregation',
      metadata: {
        count: hotDeals.length,
        timestamp: new Date().toISOString(),
        scoring: 'real_time_algorithm'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Hot deals API error', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hot deals'
    });
  }
});

// Free events using live APIs
app.get('/api/deals/free', async (req, res) => {
  try {
    logger.info('Fetching free events from live APIs');
    const freeEvents = await eventAggregationService.getFreeEvents(30);
    
    res.json({
      success: true,
      deals: freeEvents,
      source: 'live_api_aggregation',
      metadata: {
        count: freeEvents.length,
        timestamp: new Date().toISOString(),
        price_filter: 'free_only'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Free events API error', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch free events'
    });
  }
});

// Search events using live APIs
app.get('/api/deals/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }
    
    logger.info('Searching events in live APIs', { query: q });
    const searchResults = await eventAggregationService.searchByName(q as string);
    
    res.json({
      success: true,
      deals: searchResults,
      query: q,
      source: 'live_api_search',
      metadata: {
        count: searchResults.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Search API error', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to search events'
    });
  }
});

// Premium API endpoint with live data
app.get('/api/premium/deals', authenticateToken, requireSubscription('premium'), async (req, res) => {
  try {
    logger.info('Premium user accessing live deal data');
    
    const aggregatedDeals = await eventAggregationService.searchAllEvents({
      category: 'all'
    });
    
    // Limit to premium user allowance
    const premiumDeals = aggregatedDeals.slice(0, 100);
    
    res.json({
      success: true,
      deals: premiumDeals,
      premium: true,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'live_apis_premium',
        user_tier: req.user?.tier
      }
    });
  } catch (error) {
    logger.error('Premium deals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch premium deals'
    });
  }
});

// API Routes with live data
app.use('/api/users', userRoutes);
app.use('/api/deals', dealRoutes);

// MVP Bypass Routes - Mock responses until approval
app.use('/api/subscriptions', subscriptionRoutes); // Uses mock Stripe responses
app.use('/api/sms-consent', smsConsentRoutes); // Uses mock Twilio responses

// Serve legal documents (required for Twilio/Stripe approval)
app.use('/legal', express.static(path.join(__dirname, '../legal-site')));

// API-only server - Frontend served separately
app.get('/', (req, res) => {
  res.json({
    name: 'Rip City Ticket Dispatch API',
    version: '1.0.0',
    status: 'active',
    description: 'Portland Event Ticket Aggregation API',
    endpoints: {
      health: '/health',
      api: '/api/*',
      legal: '/legal/*'
    },
    frontend: 'Served separately - not from this API server',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for unknown routes
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
        '/api/deals/free',
        '/api/deals/search'
      ]
    });
  }
  
  // Legal routes
  if (req.path.startsWith('/legal/')) {
    return res.sendFile(path.join(__dirname, '../legal-site/index.html'));
  }
  
  // All other routes return API info
  res.status(404).json({
    error: 'Not Found',
    message: 'This is an API server. Frontend is served separately.',
    api_documentation: '/api/docs'
  });
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Graceful shutdown handling
const server = app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🚀 Rip City DYNAMIC Server running on port ${PORT}`);
  logger.info(`🏀 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Domain: ripcityticketdispatch.works (via Cloudflare)`);
  logger.info(`☁️  Hosting: DigitalOcean`);
  logger.info(`🍃 Database: MongoDB (DigitalOcean)`);
  logger.info(`🎫 Ticketmaster API: ${process.env.TICKETMASTER_KEY ? 'LIVE & CERTIFIED ✅' : 'MISSING ❌'}`);
  logger.info(`🎪 Eventbrite API: ${process.env.EVENTBRITE_KEY ? 'LIVE & CERTIFIED ✅' : 'MISSING ❌'}`);
  logger.info(`💳 Stripe: BYPASSED FOR MVP (awaiting approval)`);
  logger.info(`📱 Twilio SMS: BYPASSED FOR MVP (awaiting approval)`);
  logger.info(`📧 SendGrid: BYPASSED FOR MVP (awaiting approval)`);
  logger.info(`🤖 Server Type: DYNAMIC (Real API calls, not static mock data)`);
  
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
