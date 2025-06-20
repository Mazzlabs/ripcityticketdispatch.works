/**
 * RIP CITY TICKET DISPATCH - HTTPS SERVER
 * HTTPS-enabled server with SSL/TLS certificate support
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */

import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import logger from './utils/logger';

// Database connection
import MongoDB from './database/connection';

// Live API Services
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

// Load environment variables
dotenv.config();

const app = express();
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '8080', 10);
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '8443', 10);

// Initialize services
const dealScoringService = new DealScoringService();

// SSL Certificate paths
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, '../../ripcityticketdispatch.works.key');
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, '../../ripcityticketdispatch.works.pem');

// Check for SSL certificates
let sslCredentials: { key: string; cert: string } | null = null;
try {
  if (fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)) {
    sslCredentials = {
      key: fs.readFileSync(SSL_KEY_PATH, 'utf8'),
      cert: fs.readFileSync(SSL_CERT_PATH, 'utf8')
    };
    logger.info('SSL certificates loaded successfully');
  } else {
    logger.warn('SSL certificates not found, HTTPS server will not start');
  }
} catch (error) {
  logger.error('Failed to load SSL certificates:', error);
}

// Force HTTPS middleware (for production)
const forceHTTPS = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
};

// Security headers for HTTPS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      imgSrc: ["'self'", "data:", "https:", "https://*.ticketmaster.com", "https://*.eventbrite.com"],
      connectSrc: ["'self'", "https://api.mixpanel.com", "https://www.google-analytics.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      blockAllMixedContent: []
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// HTTPS CORS configuration
const corsOptions = {
  origin: [
    'https://ripcityticketdispatch.works',
    'https://www.ripcityticketdispatch.works',
    'https://mazzlabs.works',
    'https://mazzlabs.me',
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://localhost:3001'] : [])
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use(forceHTTPS);
}

// Rate limiting for HTTPS server
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retry_after: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTPS health check
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await MongoDB.healthCheck();
    
    // Test live API connections
    let ticketmasterHealth = false;
    let eventbriteHealth = false;
    
    try {
      if (process.env.TICKETMASTER_KEY) {
        await ticketmasterService.getVenues();
        ticketmasterHealth = true;
      }
    } catch (e) {
      logger.warn('Ticketmaster API check failed:', e);
    }
    
    try {
      if (process.env.EVENTBRITE_KEY) {
        await eventbriteService.getPortlandEvents();
        eventbriteHealth = true;
      }
    } catch (e) {
      logger.warn('Eventbrite API check failed:', e);
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      protocol: req.secure ? 'https' : 'http',
      ssl_enabled: !!sslCredentials,
      services: {
        database: dbHealth ? 'connected' : 'disconnected',
        ticketmaster: ticketmasterHealth ? 'live_api_active' : 'api_error',
        eventbrite: eventbriteHealth ? 'live_api_active' : 'api_error',
        stripe: 'bypassed_mvp',
        twilio: 'bypassed_mvp',
        sendgrid: 'bypassed_mvp'
      },
      environment: process.env.NODE_ENV || 'development',
      security: {
        https_enabled: !!sslCredentials,
        hsts_enabled: process.env.NODE_ENV === 'production',
        force_https: process.env.NODE_ENV === 'production'
      }
    });
  } catch (error) {
    logger.error('HTTPS health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      protocol: req.secure ? 'https' : 'http'
    });
  }
});

// SSL Certificate info endpoint
app.get('/api/ssl/info', (req, res) => {
  res.json({
    ssl_enabled: !!sslCredentials,
    certificates_loaded: !!sslCredentials,
    key_path: SSL_KEY_PATH,
    cert_path: SSL_CERT_PATH,
    https_port: HTTPS_PORT,
    http_port: HTTP_PORT,
    force_https: process.env.NODE_ENV === 'production',
    timestamp: new Date().toISOString()
  });
});

// Live API endpoints
app.get('/api/venues', async (req, res) => {
  try {
    logger.info('HTTPS: Fetching venues from live Ticketmaster API');
    const venues = await ticketmasterService.getVenues();
    
    res.json({
      success: true,
      venues,
      source: 'ticketmaster_live_api',
      metadata: {
        count: venues.length,
        timestamp: new Date().toISOString(),
        protocol: req.secure ? 'https' : 'http',
        api_key_status: 'certified'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('HTTPS Ticketmaster API error', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch venues from live API',
      protocol: req.secure ? 'https' : 'http',
      details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined
    });
  }
});

// Events endpoint with HTTPS context
app.get('/api/events', async (req, res) => {
  try {
    const { category, limit = '50' } = req.query;
    logger.info('HTTPS: Fetching events from live APIs', { category, limit });
    
    const filters = {
      category: (category as 'sports' | 'music' | 'entertainment' | 'all') || 'all'
    };
    
    const events = await eventAggregationService.searchAllEvents(filters);
    const limitedEvents = events.slice(0, parseInt(limit as string || '50'));
    
    res.json({
      success: true,
      events: limitedEvents,
      sources: ['ticketmaster_live', 'eventbrite_live'],
      metadata: {
        total: limitedEvents.length,
        timestamp: new Date().toISOString(),
        protocol: req.secure ? 'https' : 'http',
        api_status: 'live_certified_apis',
        category_filter: category || 'all'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('HTTPS API aggregation error', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events from live APIs',
      protocol: req.secure ? 'https' : 'http',
      details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined
    });
  }
});

// Blazers endpoint
app.get('/api/blazers', async (req, res) => {
  try {
    logger.info('HTTPS: Fetching Trail Blazers events');
    const blazersEvents = await ticketmasterService.getBlazersEvents();
    
    res.json({
      success: true,
      events: blazersEvents,
      source: 'ticketmaster_live_api',
      metadata: {
        count: blazersEvents.length,
        timestamp: new Date().toISOString(),
        protocol: req.secure ? 'https' : 'http',
        team: 'Portland Trail Blazers'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('HTTPS Blazers API error', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Blazers events',
      protocol: req.secure ? 'https' : 'http'
    });
  }
});

// Hot deals endpoint
app.get('/api/deals/hot', async (req, res) => {
  try {
    logger.info('HTTPS: Generating hot deals');
    const hotDeals = await eventAggregationService.getHotDeals(20);
    
    res.json({
      success: true,
      deals: hotDeals,
      source: 'live_api_aggregation',
      metadata: {
        count: hotDeals.length,
        timestamp: new Date().toISOString(),
        protocol: req.secure ? 'https' : 'http',
        scoring: 'real_time_algorithm'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('HTTPS hot deals error', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hot deals',
      protocol: req.secure ? 'https' : 'http'
    });
  }
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/sms-consent', smsConsentRoutes);

// Serve legal documents
app.use('/legal', express.static(path.join(__dirname, '../legal-site')));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Rip City Ticket Dispatch API',
    version: '1.0.0',
    status: 'active',
    description: 'Portland Event Ticket Aggregation API - HTTPS Server',
    protocol: req.secure ? 'https' : 'http',
    ssl_enabled: !!sslCredentials,
    endpoints: {
      health: '/health',
      ssl_info: '/api/ssl/info',
      api: '/api/*',
      legal: '/legal/*'
    },
    security_features: [
      'SSL/TLS encryption',
      'HSTS headers',
      'Force HTTPS redirect',
      'Enhanced CSP headers',
      'Mixed content blocking'
    ],
    timestamp: new Date().toISOString()
  });
});

// 404 handlers
app.get('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found',
    protocol: req.secure ? 'https' : 'http',
    available_endpoints: [
      '/api/venues',
      '/api/events', 
      '/api/blazers',
      '/api/deals/hot',
      '/api/ssl/info'
    ]
  });
});

app.get('/legal/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../legal-site/index.html'));
});

app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'This is an HTTPS API server.',
    protocol: req.secure ? 'https' : 'http',
    api_documentation: '/api/ssl/info'
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('HTTPS server error', { 
    error: error.message, 
    stack: error.stack,
    path: req.path,
    method: req.method,
    protocol: req.secure ? 'https' : 'http'
  });
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    protocol: req.secure ? 'https' : 'http'
  });
});

// Start servers
let httpServer: http.Server;
let httpsServer: https.Server | null = null;

const startServers = async () => {
  // Start HTTP server
  httpServer = http.createServer(app);
  httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    logger.info(`🌐 HTTP Server running on port ${HTTP_PORT}`);
  });

  // Start HTTPS server if certificates are available
  if (sslCredentials) {
    httpsServer = https.createServer(sslCredentials, app);
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
      logger.info(`🔒 HTTPS Server running on port ${HTTPS_PORT}`);
    });
  }

  logger.info(`🚀 Rip City HTTPS Server started`);
  logger.info(`🏀 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🌐 HTTP Port: ${HTTP_PORT}`);
  logger.info(`🔒 HTTPS Port: ${HTTPS_PORT} ${sslCredentials ? '✅' : '❌ (No certificates)'}`);
  logger.info(`🍃 Database: MongoDB (DigitalOcean)`);
  logger.info(`🎫 Ticketmaster API: ${process.env.TICKETMASTER_KEY ? 'LIVE & CERTIFIED ✅' : 'MISSING ❌'}`);
  logger.info(`🎪 Eventbrite API: ${process.env.EVENTBRITE_KEY ? 'LIVE & CERTIFIED ✅' : 'MISSING ❌'}`);
  logger.info(`🔧 Server Type: HTTPS (SSL/TLS enabled)`);

  // Initialize database connection
  try {
    await MongoDB.connect();
    logger.info('🗄️ MongoDB connection established');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const shutdown = async () => {
  logger.info('Shutting down HTTPS server gracefully');
  
  if (httpServer) {
    httpServer.close();
  }
  
  if (httpsServer) {
    httpsServer.close();
  }
  
  await MongoDB.disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the servers
startServers().catch(error => {
  logger.error('Failed to start HTTPS server:', error);
  process.exit(1);
});

export default app;
