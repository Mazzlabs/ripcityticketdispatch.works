/**
 * RIP CITY TICKET DISPATCH - PRODUCTION SERVER WITH LIVE APIS
 * DigitalOcean → MongoDB → Cloudflare Deployment
 * Uses REAL Ticketmaster & Eventbrite APIs, bypasses Twilio/Stripe/SendGrid for MVP
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
import EventAggregationService from './services/eventAggregation';

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
const eventAggregationService = new EventAggregationService();

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
      await eventbriteService.getEvents();
      eventbriteHealth = true;
    } catch (e) {
      logger.warn('Eventbrite API check failed:', e);
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth ? 'connected' : 'disconnected',
        ticketmaster: ticketmasterHealth ? 'connected' : 'error',
        eventbrite: eventbriteHealth ? 'connected' : 'error',
        // MVP bypassed services
        stripe: 'bypassed_mvp',
        twilio: 'bypassed_mvp',
        sendgrid: 'bypassed_mvp'
      },
      environment: process.env.NODE_ENV || 'development'
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

app.get('/api/events', async (req, res) => {
  try {
    logger.info('Fetching events from live APIs');
    
    // Fetch from both live APIs
    const [ticketmasterEvents, eventbriteEvents] = await Promise.allSettled([
      ticketmasterService.getEvents(),
      eventbriteService.getEvents()
    ]);
    
    let allEvents = [];
    const sources = [];
    
    if (ticketmasterEvents.status === 'fulfilled') {
      allEvents.push(...ticketmasterEvents.value);
      sources.push('ticketmaster_live');
    }
    
    if (eventbriteEvents.status === 'fulfilled') {
      allEvents.push(...eventbriteEvents.value);
      sources.push('eventbrite_live');
    }
    
    // Apply deal scoring to live data
    const scoredEvents = allEvents.map(event => ({
      ...event,
      dealScore: dealScoringService.calculateDealScore(event)
    }));
    
    res.json({
      success: true,
      events: scoredEvents,
      sources,
      metadata: {
        total: scoredEvents.length,
        timestamp: new Date().toISOString(),
        api_status: 'live_certified_apis'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Live API aggregation error', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events from live APIs'
    });
  }
});

// Premium API endpoint with live data
app.get('/api/premium/deals', authenticateToken, requireSubscription('premium'), async (req, res) => {
  try {
    logger.info('Premium user accessing live deal data');
    
    const aggregatedDeals = await eventAggregationService.getAggregatedDeals({
      includePreSales: true,
      includePremiumVenues: true,
      maxResults: 100
    });
    
    res.json({
      success: true,
      deals: aggregatedDeals,
      premium: true,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'live_apis_premium'
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

// Serve React frontend from build directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Catch-all handler for React Router
app.get('*', (req, res) => {
  // API routes return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      success: false, 
      error: 'API endpoint not found',
      available_endpoints: ['/api/venues', '/api/events', '/api/deals', '/api/users']
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
  logger.info(`🚀 Rip City Production Server running on port ${PORT}`);
  logger.info(`🏀 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Domain: ripcityticketdispatch.works (via Cloudflare)`);
  logger.info(`☁️  Hosting: DigitalOcean`);
  logger.info(`🍃 Database: MongoDB (DigitalOcean)`);
  logger.info(`🎫 Ticketmaster API: ${process.env.TICKETMASTER_KEY ? 'LIVE & CERTIFIED' : 'MISSING'}`);
  logger.info(`🎪 Eventbrite API: ${process.env.EVENTBRITE_KEY ? 'LIVE & CERTIFIED' : 'MISSING'}`);
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
