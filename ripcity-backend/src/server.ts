import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import winston from 'winston';
import path from 'path';
import ticketmasterService from './services/ticketmaster';
import { DealScoringService } from './services/dealScoring';
import userRoutes from './routes/users';
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
    // Remove file logging for containerized deployment
  ]
});

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Initialize services with fallback for missing API key
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
    
    const events = await ticketmasterService.searchEvents({
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

app.get('/api/blazers', async (req, res) => {
  try {
    logger.info('Fetching Trail Blazers games');
    
    const blazerGames = await ticketmasterService.getBlazersEvents();
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
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Serve static files from the parent directory (where the frontend files are)
app.use(express.static(path.join(__dirname, '..', '..')));

// Catch-all for frontend routing - serve index.html for non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', '..', 'index.html'));
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
  logger.info(`🔑 Ticketmaster API configured: ${!!process.env.TICKETMASTER_API_KEY}`);
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
