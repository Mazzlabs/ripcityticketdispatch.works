/**
 * RIP CITY TICKET DISPATCH - Live Eventbrite API Server
 * Dedicated server for Eventbrite API integration
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import logger from './utils/logger';
import MongoDB from './database/connection';
import eventbriteService from './services/eventbrite';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8082', 10);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: [
    'https://ripcityticketdispatch.works',
    'https://mazzlabs.works',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Rate limiting for API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Eventbrite has stricter limits
  message: 'Too many Eventbrite API requests'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await MongoDB.healthCheck();
    const apiStatus = !!process.env.EVENTBRITE_KEY;
    
    res.json({
      service: 'eventbrite-api',
      status: 'healthy',
      database: dbHealth ? 'connected' : 'disconnected',
      eventbrite_api: apiStatus ? 'configured' : 'missing_key',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      service: 'eventbrite-api',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Eventbrite-specific endpoints
app.get('/api/eventbrite/events', async (req, res) => {
  try {
    const { location = 'Portland', category, price_filter } = req.query;
    logger.info('Fetching Eventbrite events', { location, category, price_filter });
    
    const events = await eventbriteService.getPortlandEvents();
    
    res.json({
      success: true,
      service: 'eventbrite',
      events,
      metadata: {
        count: events.length,
        location,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Eventbrite events error:', error);
    res.status(500).json({
      success: false,
      service: 'eventbrite',
      error: 'Failed to fetch events from Eventbrite API'
    });
  }
});

app.get('/api/eventbrite/music', async (req, res) => {
  try {
    logger.info('Fetching Eventbrite music events');
    
    const musicEvents = await eventbriteService.getMusicEvents();
    
    res.json({
      success: true,
      service: 'eventbrite',
      category: 'music',
      events: musicEvents,
      metadata: {
        count: musicEvents.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Eventbrite music events error:', error);
    res.status(500).json({
      success: false,
      service: 'eventbrite',
      error: 'Failed to fetch music events'
    });
  }
});

app.get('/api/eventbrite/entertainment', async (req, res) => {
  try {
    logger.info('Fetching Eventbrite entertainment events');
    
    const entertainmentEvents = await eventbriteService.getEntertainmentEvents();
    
    res.json({
      success: true,
      service: 'eventbrite',
      category: 'entertainment',
      events: entertainmentEvents,
      metadata: {
        count: entertainmentEvents.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Eventbrite entertainment events error:', error);
    res.status(500).json({
      success: false,
      service: 'eventbrite',
      error: 'Failed to fetch entertainment events'
    });
  }
});

app.get('/api/eventbrite/free', async (req, res) => {
  try {
    logger.info('Fetching free Eventbrite events');
    
    const freeEvents = await eventbriteService.getFreeEvents();
    
    res.json({
      success: true,
      service: 'eventbrite',
      category: 'free',
      events: freeEvents,
      metadata: {
        count: freeEvents.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Eventbrite free events error:', error);
    res.status(500).json({
      success: false,
      service: 'eventbrite',
      error: 'Failed to fetch free events'
    });
  }
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Eventbrite service error:', error);
  res.status(500).json({
    success: false,
    service: 'eventbrite',
    error: 'Internal Eventbrite service error'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🎪 Eventbrite API Service running on port ${PORT}`);
  logger.info(`🔑 API Key: ${process.env.EVENTBRITE_KEY ? 'CONFIGURED' : 'MISSING'}`);
  
  try {
    await MongoDB.connect();
    logger.info('🗄️ Database connected');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down Eventbrite service');
  server.close(async () => {
    await MongoDB.disconnect();
    process.exit(0);
  });
});

export default app;
