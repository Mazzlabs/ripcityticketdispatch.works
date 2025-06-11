import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import winston from 'winston';

// Import services
import { TicketmasterService } from './services/ticketmaster';
import { DealScoringService } from './services/dealScoring';
import { alertService } from './services/alertService';

// Import routes
import dealsRouter from './routes/deals';
import usersRouter from './routes/users';

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
    // Remove file logging for containerized deployment
  ]
});

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Initialize services with fallback for missing API key
const apiKey = process.env.TICKETMASTER_API_KEY || 'demo-key';
const ticketmasterService = new TicketmasterService(apiKey);
const dealScoringService = new DealScoringService();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    'https://ripcityticketdispatch.works',
    'https://mazzlabs.works',
    'http://localhost:3000'
  ]
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/deals', dealsRouter);
app.use('/api/users', usersRouter);

// Portland Trail Blazers specific endpoint
app.get('/api/blazers', async (req, res) => {
  try {
    logger.info('Fetching Blazers events');
    
    const events = await ticketmasterService.searchEvents({
      keyword: 'Portland Trail Blazers',
      city: 'Portland',
      stateCode: 'OR',
      classificationName: 'Basketball',
      size: 20
    });

    if (!events || events.length === 0) {
      return res.json({
        message: 'No Blazers games found',
        events: [],
        deals: []
      });
    }

    // Score deals for each event
    const deals = [];
    for (const event of events) {
      try {
        const eventDeals = await dealScoringService.scoreEventDeals(event);
        deals.push(...eventDeals);
      } catch (error) {
        logger.warn(`Failed to score deals for event ${event.id}:`, error);
      }
    }

    // Sort by deal score
    deals.sort((a, b) => b.score - a.score);

    res.json({
      events: events.length,
      deals: deals.slice(0, 10), // Top 10 deals
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Blazers endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Blazers data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Venues endpoint
app.get('/api/venues', async (req, res) => {
  try {
    logger.info('Fetching Portland venues');
    
    const venues = await ticketmasterService.searchVenues({
      city: 'Portland',
      stateCode: 'OR',
      size: 50
    });

    res.json({
      venues: venues || [],
      count: venues?.length || 0,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Venues endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch venues data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Catch-all error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /health',
      'GET /api/deals',
      'GET /api/blazers', 
      'GET /api/venues',
      'POST /api/users/register',
      'POST /api/users/login',
      'GET /api/users/profile'
    ]
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🎟️ Rip City Ticket Dispatch API running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;
