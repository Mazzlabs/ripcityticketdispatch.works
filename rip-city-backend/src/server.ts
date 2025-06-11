import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import winston from 'winston';
import { TicketmasterService } from './services/ticketmaster';
import { DealScoringService } from './services/dealScoring';

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
const PORT = parseInt(process.env.PORT || '3001', 10);

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
app.get('/api/deals', async (req, res) => {
  try {
    const { city = 'portland', category, minPrice, maxPrice } = req.query;
    
    logger.info('Fetching deals', { city, category, minPrice, maxPrice });
    
    const events = await ticketmasterService.getEvents({
      city: city as string,
      classificationName: category as string,
      minPrice: minPrice as string,
      maxPrice: maxPrice as string
    });
    
    const deals = dealScoringService.scoreDeals(events);
    
    res.json({
      success: true,
      deals,
      metadata: {
        count: deals.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching deals', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deals'
    });
  }
});

app.get('/api/blazers', async (req, res) => {
  try {
    logger.info('Fetching Trail Blazers games');
    
    const blazerGames = await ticketmasterService.getTrailBlazersEvents();
    const deals = dealScoringService.scoreDeals(blazerGames);
    
    res.json({
      success: true,
      deals,
      metadata: {
        count: deals.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching Blazers games', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Trail Blazers games'
    });
  }
});

app.get('/api/venues', async (req, res) => {
  try {
    logger.info('Fetching Portland venues');
    
    const venues = await ticketmasterService.getPortlandVenues();
    
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

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Graceful shutdown handling
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Rip City Backend running on port ${PORT}`);
  logger.info(`🏀 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔑 API Key configured: ${apiKey !== 'demo-key'}`);
});

// Handle graceful shutdown
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
