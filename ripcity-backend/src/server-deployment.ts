/**
 * RIP CITY TICKET DISPATCH - DEPLOYMENT SERVER
 * Deployment-ready server with Twilio, SendGrid, and Stripe disabled
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
import MongoDB from './database/connection';
import logger from './utils/logger';

// Import routes
import userRoutes from './routes/users';
import dealsRoutes from './routes/deals';
import subscriptionRoutes from './routes/subscriptions';
import smsConsentRoutes from './routes/smsConsent';

// Import services (but disable payment/messaging)
import eventbriteService from './services/eventbrite';
import ticketmasterService from './services/ticketmaster';
import { DealScoringService } from './services/dealScoring';
import EventAggregationService from './services/eventAggregation';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

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

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await MongoDB.healthCheck();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbHealth ? 'connected' : 'disconnected',
      services: {
        mongodb: dbHealth,
        ticketmaster: true,
        eventbrite: true,
        // Note: Stripe, Twilio, SendGrid disabled for deployment
        stripe: 'disabled',
        twilio: 'disabled',
        sendgrid: 'disabled'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed'
    });
  }
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/sms-consent', smsConsentRoutes);

// Serve legal documents
app.use('/legal', express.static(path.join(__dirname, '../legal-site')));

// Serve React frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Catch-all handler for React Router
app.get('*', (req, res) => {
  // If it's an API route, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For legal routes, serve legal site
  if (req.path.startsWith('/legal/')) {
    return res.sendFile(path.join(__dirname, '../legal-site/index.html'));
  }
  
  // Otherwise serve React app
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Modified Alert Service for deployment (no actual sending)
class DeploymentAlertService {
  async processDeals(deals: any[]) {
    logger.info(`🎯 Processing ${deals.length} deals for alerts (deployment mode)`);
    
    const dealScoringService = new DealScoringService();
    
    for (const deal of deals) {
      const scoredDeals = dealScoringService.scoreDeals([deal]);
      if (scoredDeals.length > 0 && scoredDeals[0].dealScore > 70) {
        logger.info(`🔥 High-value deal detected: ${deal.name || deal.title} (Score: ${scoredDeals[0].dealScore})`);
        // In deployment: just log, don't send actual alerts
        await this.logAlert(deal, scoredDeals[0].dealScore);
      }
    }
  }

  private async logAlert(deal: any, score: number) {
    logger.info(`📧 [DEPLOYMENT] Would send alert for: ${deal.title}`);
    logger.info(`📱 [DEPLOYMENT] Deal score: ${score}`);
    logger.info(`💰 [DEPLOYMENT] Price: ${deal.price}`);
    
    // Save to database but don't actually send
    try {
      await MongoDB.addAlertHistory('deployment-user', deal.id, 'deal-alert');
    } catch (error) {
      logger.error('Failed to log alert to database:', error);
    }
  }
}

// Initialize services
const alertService = new DeploymentAlertService();
// Services are already instantiated and imported above

// Background job for ticket monitoring (but limited for deployment)
async function runTicketMonitoring() {
  try {
    logger.info('🎫 Starting ticket monitoring cycle...');
    
    // Get deals from Eventbrite
    const eventbriteDeals = await eventbriteService.searchEvents({ 
      location: 'Portland, OR',
      name_filter: 'Trail Blazers'
    });
    logger.info(`Found ${eventbriteDeals.length} Eventbrite deals`);
    
    // Get deals from Ticketmaster
    const ticketmasterDeals = await ticketmasterService.searchEvents({ 
      city: 'Portland',
      keyword: 'Trail Blazers'
    });
    logger.info(`Found ${ticketmasterDeals.length} Ticketmaster deals`);
    
    // Combine and process deals
    const allDeals = [...eventbriteDeals, ...ticketmasterDeals];
    
    // Process through alert system (deployment mode)
    await alertService.processDeals(allDeals);
    
    logger.info('✅ Ticket monitoring cycle completed');
  } catch (error) {
    logger.error('❌ Ticket monitoring failed:', error);
  }
}

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await MongoDB.connect();
    logger.info('🍃 MongoDB connected successfully');
    
    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 Rip City Ticket Dispatch Server running on port ${PORT}`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV}`);
      logger.info(`📋 Legal docs: http://localhost:${PORT}/legal`);
      logger.info(`💻 Frontend: http://localhost:${PORT}`);
      logger.info(`⚠️  Deployment mode: Stripe, Twilio, SendGrid disabled`);
    });
    
    // Start background monitoring (limited frequency for deployment)
    setInterval(runTicketMonitoring, 10 * 60 * 1000); // Every 10 minutes
    
    // Run initial monitoring
    setTimeout(runTicketMonitoring, 5000); // After 5 seconds
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

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

// Start the server
startServer();
