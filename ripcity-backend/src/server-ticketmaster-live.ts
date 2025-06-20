/**
 * RIP CITY TICKET DISPATCH - Live Ticketmaster API Server
 * Dedicated server for Ticketmaster API integration
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
import ticketmasterService from './services/ticketmaster';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8081', 10);

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
  max: 200, // Higher limit for Ticketmaster service
  message: 'Too many Ticketmaster API requests'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await MongoDB.healthCheck();
    const apiStatus = !!process.env.TICKETMASTER_KEY;
    
    res.json({
      service: 'ticketmaster-api',
      status: 'healthy',
      database: dbHealth ? 'connected' : 'disconnected',
      ticketmaster_api: apiStatus ? 'configured' : 'missing_key',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      service: 'ticketmaster-api',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Ticketmaster-specific endpoints
app.get('/api/ticketmaster/venues', async (req, res) => {
  try {
    const { city = 'Portland' } = req.query;
    logger.info('Fetching Ticketmaster venues', { city });
    
    const venues = await ticketmasterService.getVenues(city as string);
    
    res.json({
      success: true,
      service: 'ticketmaster',
      venues,
      metadata: {
        count: venues.length,
        city,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Ticketmaster venues error:', error);
    res.status(500).json({
      success: false,
      service: 'ticketmaster',
      error: 'Failed to fetch venues from Ticketmaster API'
    });
  }
});

app.get('/api/ticketmaster/events', async (req, res) => {
  try {
    const { 
      city = 'Portland',
      keyword,
      classificationName,
      startDateTime,
      size = '20'
    } = req.query;
    
    logger.info('Fetching Ticketmaster events', { 
      city, keyword, classificationName, size 
    });
    
    const events = await ticketmasterService.searchEvents({
      city: city as string,
      keyword: keyword as string,
      classificationName: classificationName as string,
      startDateTime: startDateTime as string,
      size: size as string
    });
    
    res.json({
      success: true,
      service: 'ticketmaster',
      events,
      metadata: {
        count: events.length,
        city,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Ticketmaster events error:', error);
    res.status(500).json({
      success: false,
      service: 'ticketmaster',
      error: 'Failed to fetch events from Ticketmaster API'
    });
  }
});

app.get('/api/ticketmaster/blazers', async (req, res) => {
  try {
    logger.info('Fetching Portland Trail Blazers events');
    
    const blazersEvents = await ticketmasterService.searchEvents({
      city: 'Portland',
      keyword: 'Portland Trail Blazers',
      classificationName: 'Sports'
    });
    
    res.json({
      success: true,
      service: 'ticketmaster',
      team: 'Portland Trail Blazers',
      events: blazersEvents,
      metadata: {
        count: blazersEvents.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Blazers events error:', error);
    res.status(500).json({
      success: false,
      service: 'ticketmaster',
      error: 'Failed to fetch Blazers events'
    });
  }
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Ticketmaster service error:', error);
  res.status(500).json({
    success: false,
    service: 'ticketmaster',
    error: 'Internal Ticketmaster service error'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🎫 Ticketmaster API Service running on port ${PORT}`);
  logger.info(`🔑 API Key: ${process.env.TICKETMASTER_KEY ? 'CONFIGURED' : 'MISSING'}`);
  
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
  logger.info('SIGTERM received, shutting down Ticketmaster service');
  server.close(async () => {
    await MongoDB.disconnect();
    process.exit(0);
  });
});

export default app;
