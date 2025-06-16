/**
 * RIP CITY TICKET DISPATCH - Demo Deployment Server
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 * 
 * This is a demonstration server that showcases functionality without external API calls
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import logger from './utils/logger';
import MongoDB from './database/connection';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for demo
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Basic middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Serve static files
app.use('/legal', express.static(path.join(__dirname, '../legal-site')));
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// Demo data for showcasing functionality
const demoTicketData = [
  {
    id: '1',
    event: 'Portland Trail Blazers vs Lakers',
    venue: 'Moda Center',
    date: '2025-07-15',
    originalPrice: 150,
    currentPrice: 89,
    savings: 61,
    savingsPercent: 41,
    section: '100 Level',
    category: 'NBA',
    lastUpdated: new Date()
  },
  {
    id: '2',
    event: 'Portland Timbers vs Seattle Sounders',
    venue: 'Providence Park',
    date: '2025-07-20',
    originalPrice: 75,
    currentPrice: 45,
    savings: 30,
    savingsPercent: 40,
    section: 'General Admission',
    category: 'MLS',
    lastUpdated: new Date()
  }
];

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const mongoStatus = await MongoDB.healthCheck();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: mongoStatus ? 'connected' : 'disconnected',
        server: 'running'
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Service unavailable'
    });
  }
});

// API endpoints for demo
app.get('/api/deals', (req, res) => {
  logger.info('Demo deals endpoint accessed');
  
  // Simulate deal scoring and filtering
  const scoredDeals = demoTicketData.map(deal => ({
    ...deal,
    score: Math.floor(Math.random() * 100),
    trending: Math.random() > 0.5
  }));
  
  res.json({
    success: true,
    deals: scoredDeals,
    totalDeals: scoredDeals.length,
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/venues', (req, res) => {
  logger.info('Demo venues endpoint accessed');
  
  const venues = [
    { id: 1, name: 'Moda Center', city: 'Portland', capacity: 19441 },
    { id: 2, name: 'Providence Park', city: 'Portland', capacity: 25218 },
    { id: 3, name: 'Veterans Memorial Coliseum', city: 'Portland', capacity: 12888 }
  ];
  
  res.json({
    success: true,
    venues
  });
});

app.get('/api/categories', (req, res) => {
  logger.info('Demo categories endpoint accessed');
  
  const categories = [
    { id: 1, name: 'NBA', count: 15 },
    { id: 2, name: 'MLS', count: 8 },
    { id: 3, name: 'Concerts', count: 25 },
    { id: 4, name: 'Theater', count: 12 }
  ];
  
  res.json({
    success: true,
    categories
  });
});

// Demo scraper status endpoint
app.get('/api/scraper-status', (req, res) => {
  logger.info('Demo scraper status endpoint accessed');
  
  const scraperStatus = {
    ticketmaster: {
      status: 'active',
      lastRun: new Date().toISOString(),
      dealsFound: 45,
      nextRun: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    },
    eventbrite: {
      status: 'active',
      lastRun: new Date().toISOString(),
      dealsFound: 23,
      nextRun: new Date(Date.now() + 20 * 60 * 1000).toISOString()
    }
  };
  
  res.json({
    success: true,
    scrapers: scraperStatus,
    systemStatus: 'operational'
  });
});

// Demo user endpoints
app.get('/api/users/demo', async (req, res) => {
  logger.info('Demo user endpoint accessed');
  
  try {
    // Simulate user data without actually creating database records
    const demoUser = {
      id: 'demo-user-123',
      email: 'demo@ripcityticketdispatch.works',
      firstName: 'Demo',
      lastName: 'User',
      subscription: 'free',
      preferences: {
        categories: ['NBA', 'MLS'],
        venues: ['Moda Center'],
        maxPrice: 200,
        minSavings: 25
      },
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      user: demoUser
    });
  } catch (error) {
    logger.error('Demo user endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Demo user data unavailable'
    });
  }
});

// Legal document routes
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Rip City Ticket Dispatch - Demo</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #e03e2d; }
          .section { margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; }
          a { color: #e03e2d; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>🏀 Rip City Ticket Dispatch - Demo Environment</h1>
        
        <div class="section">
          <h2>System Status</h2>
          <p>This is a demonstration deployment showcasing core functionality without external API calls.</p>
          <a href="/api/health">Health Check</a>
        </div>
        
        <div class="section">
          <h2>Demo API Endpoints</h2>
          <ul>
            <li><a href="/api/deals">Demo Ticket Deals</a></li>
            <li><a href="/api/venues">Portland Venues</a></li>
            <li><a href="/api/categories">Event Categories</a></li>
            <li><a href="/api/scraper-status">Scraper Status</a></li>
            <li><a href="/api/users/demo">Demo User Profile</a></li>
          </ul>
        </div>
        
        <div class="section">
          <h2>Legal Documentation</h2>
          <ul>
            <li><a href="/legal/terms.html">Terms of Service</a></li>
            <li><a href="/legal/privacy.html">Privacy Policy</a></li>
            <li><a href="/legal/sms-consent.html">SMS Consent</a></li>
          </ul>
        </div>
        
        <div class="section">
          <h2>Technology Stack</h2>
          <ul>
            <li>Node.js + Express Backend</li>
            <li>MongoDB Database (DigitalOcean)</li>
            <li>React Frontend</li>
            <li>TypeScript</li>
            <li>Automated Deal Detection</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await MongoDB.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await MongoDB.disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await MongoDB.connect();
    logger.info('✅ MongoDB connected successfully');
    
    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 Demo server running on port ${PORT}`);
      logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Access at: http://localhost:${PORT}`);
      logger.info(`📄 Legal docs: http://localhost:${PORT}/legal/`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Initialize server
startServer();
