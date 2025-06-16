/**
 * RIP CITY TICKET DISPATCH - HTTPS Server
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
import dotenv from 'dotenv';
import winston from 'winston';
import ticketmasterService from './services/ticketmaster';
import db from './database/mongodb';

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

import { DealScoringService } from './services/dealScoring';
import userRoutes from './routes/users';
import dealRoutes from './routes/deals';
import paymentRoutes from './routes/payments';
import subscriptionRoutes from './routes/subscriptions';
import { authenticateToken, requireSubscription } from './middleware/auth';

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
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '8443', 10);
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === 'true';

// Initialize services with fallback for missing API key
const dealScoringService = new DealScoringService();

// SSL Certificate paths
const SSL_KEY_PATH = path.join(__dirname, '../ripcityticketdispatch.works.key');
const SSL_CERT_PATH = path.join(__dirname, '../ripcityticketdispatch.works.pem');

// Check if SSL certificates exist
let sslOptions: https.ServerOptions | null = null;
if (ENABLE_HTTPS && fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)) {
  try {
    sslOptions = {
      key: fs.readFileSync(SSL_KEY_PATH),
      cert: fs.readFileSync(SSL_CERT_PATH)
    };
    logger.info('🔒 SSL certificates loaded successfully');
  } catch (error) {
    logger.error('❌ Failed to load SSL certificates:', error);
    sslOptions = null;
  }
} else {
  logger.info('ℹ️ SSL certificates not found or HTTPS not enabled');
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.ripcityticketdispatch.works", "https://ripcityticketdispatch.works"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression());
app.use(cors({
  origin: [
    'https://ripcityticketdispatch.works',
    'https://mazzlabs.works',
    'http://localhost:3000',
    'http://localhost:8080',
    'https://localhost:8443'
  ],
  credentials: true
}));
app.use(express.json());

// HTTPS-only middleware (for production behind CloudFlare)
app.use((req, res, next) => {
  // Check if request is secure (HTTPS)
  const isSecure = req.secure || 
                   req.headers['x-forwarded-proto'] === 'https' ||
                   req.headers['cf-visitor'] === '{"scheme":"https"}' ||
                   process.env.NODE_ENV === 'development';
  
  if (!isSecure && process.env.NODE_ENV === 'production') {
    // Redirect HTTP to HTTPS
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    logger.info(`Redirecting HTTP to HTTPS: ${httpsUrl}`);
    return res.redirect(301, httpsUrl);
  }
  
  next();
});

// Try multiple possible build paths for different deployment environments
const possibleBuildPaths = [
  path.join(__dirname, '../../rip-city-tickets-react/build'),  // Local development
  path.join(__dirname, '../rip-city-tickets-react/build'),     // DigitalOcean App Platform
  path.join(process.cwd(), 'rip-city-tickets-react/build'),    // Alternative deployment
  path.join(process.cwd(), '../rip-city-tickets-react/build'), // Another alternative
  path.join(process.cwd(), 'build'),                           // If build is copied to root
  path.join(__dirname, 'build'),                               // If build is copied to dist
  path.join(__dirname, '../build'),                            // If build is in parent of dist
];

let buildPath: string | null = null;
for (const possiblePath of possibleBuildPaths) {
  if (fs.existsSync(possiblePath)) {
    buildPath = possiblePath;
    logger.info(`✅ Found React build at: ${buildPath}`);
    break;
  }
}

if (buildPath) {
  app.use(express.static(buildPath, {
    // Set proper MIME types
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));
} else {
  logger.warn('⚠️ React build directory not found, frontend serving disabled');
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    buildPath: buildPath || 'not found',
    httpsEnabled: !!sslOptions,
    apiRoutes: ['/api/deals', '/api/users', '/api/payments', '/api/subscriptions', '/api/sms-consent']
  });
});

// Simple API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API routing is working!',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    secure: req.secure,
    protocol: req.protocol
  });
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
        priceHistory: [], // TODO: Add actual price history
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

// API Routes
app.use('/api/deals', dealRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Import and add SMS consent routes
import smsConsentRoutes from './routes/smsConsent';
app.use('/api/sms-consent', smsConsentRoutes);

// Serve React app for all non-API routes (client-side routing support)
app.get('*', (req, res) => {
  // Don't serve React for API routes that weren't found
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API route not found'
    });
  }
  
  // Serve React app for all other routes if build path exists
  if (buildPath) {
    const indexPath = path.join(buildPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        logger.error('Error serving React app:', err);
        res.status(404).json({
          success: false,
          error: 'Frontend not available'
        });
      }
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Frontend not configured'
    });
  }
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Create servers
let httpServer: http.Server;
let httpsServer: https.Server | null = null;

// HTTP Server (always available)
httpServer = http.createServer(app);

// HTTPS Server (if certificates are available)
if (sslOptions) {
  httpsServer = https.createServer(sslOptions, app);
}

// Graceful shutdown handling
const shutdown = async () => {
  logger.info('Shutting down servers...');
  
  const promises: Promise<void>[] = [];
  
  promises.push(new Promise<void>((resolve) => {
    httpServer.close(() => {
      logger.info('HTTP server closed');
      resolve();
    });
  }));
  
  if (httpsServer) {
    promises.push(new Promise<void>((resolve) => {
      httpsServer!.close(() => {
        logger.info('HTTPS server closed');
        resolve();
      });
    }));
  }
  
  await Promise.all(promises);
  
  try {
    await db.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database:', error);
  }
  
  logger.info('Process terminated');
  process.exit(0);
};

// Start servers
httpServer.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🚀 HTTP Server running on port ${PORT}`);
  logger.info(`🏀 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔑 Ticketmaster API configured: ${!!process.env.TICKETMASTER_API_KEY}`);
  
  // Initialize database (non-blocking for deployment)
  try {
    await db.connect();
    logger.info('🗄️ Database connection established');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    logger.warn('⚠️ Continuing without database connection');
  }
});

if (httpsServer) {
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    logger.info(`🔒 HTTPS Server running on port ${HTTPS_PORT}`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
