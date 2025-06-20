/**
 * RIP CITY TICKET DISPATCH - Deal Scoring & Analytics Server
 * Dedicated server for deal analysis and price tracking
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
import { DealScoringService } from './services/dealScoring';
import eventAggregationService from './services/eventAggregation';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8083', 10);

// Initialize services
const dealScoringService = new DealScoringService();

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Higher limit for deal analysis
  message: 'Too many deal analysis requests'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await MongoDB.healthCheck();
    
    res.json({
      service: 'deal-scoring',
      status: 'healthy',
      database: dbHealth ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      service: 'deal-scoring',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Deal scoring endpoints
app.get('/api/deals/hot', async (req, res) => {
  try {
    const { limit = '20', category } = req.query;
    logger.info('Fetching hot deals', { limit, category });
    
    // Get events from aggregation service
    const events = await eventAggregationService.searchAllEvents({
      category: category as 'sports' | 'music' | 'entertainment' | 'all' || 'all'
    });
    
    // Score the deals
    const scoredDeals = dealScoringService.scoreDeals(events);
    
    // Filter for hot deals (high score)
    const hotDeals = scoredDeals
      .filter(deal => deal.score >= 80)
      .slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      service: 'deal-scoring',
      type: 'hot_deals',
      deals: hotDeals,
      metadata: {
        count: hotDeals.length,
        min_score: 80,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Hot deals error:', error);
    res.status(500).json({
      success: false,
      service: 'deal-scoring',
      error: 'Failed to fetch hot deals'
    });
  }
});

app.get('/api/deals/trending', async (req, res) => {
  try {
    const { limit = '15' } = req.query;
    logger.info('Fetching trending deals');
    
    const events = await eventAggregationService.searchAllEvents({ category: 'all' });
    const scoredDeals = dealScoringService.scoreDeals(events);
    
    // Filter for trending deals (good score + recent)
    const trendingDeals = scoredDeals
      .filter(deal => deal.score >= 60)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      service: 'deal-scoring',
      type: 'trending_deals',
      deals: trendingDeals,
      metadata: {
        count: trendingDeals.length,
        min_score: 60,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Trending deals error:', error);
    res.status(500).json({
      success: false,
      service: 'deal-scoring',
      error: 'Failed to fetch trending deals'
    });
  }
});

app.get('/api/deals/analyze', async (req, res) => {
  try {
    const { event_id, venue, price_range } = req.query;
    logger.info('Analyzing deal', { event_id, venue, price_range });
    
    // Get comprehensive event data
    const events = await eventAggregationService.searchAllEvents({ category: 'all' });
    
    // Find specific event or similar events
    const targetEvents = events.filter(event => {
      if (event_id) return event.id === event_id;
      if (venue) return event.venue?.toLowerCase().includes((venue as string).toLowerCase());
      return true;
    });
    
    const analysis = dealScoringService.scoreDeals(targetEvents);
    
    res.json({
      success: true,
      service: 'deal-scoring',
      type: 'deal_analysis',
      analysis,
      metadata: {
        events_analyzed: targetEvents.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Deal analysis error:', error);
    res.status(500).json({
      success: false,
      service: 'deal-scoring',
      error: 'Failed to analyze deals'
    });
  }
});

app.get('/api/deals/blazers', async (req, res) => {
  try {
    logger.info('Fetching Blazers deals');
    
    const events = await eventAggregationService.searchAllEvents({ category: 'sports' });
    
    // Filter for Blazers events
    const blazersEvents = events.filter(event => 
      event.name?.toLowerCase().includes('blazers') || 
      event.name?.toLowerCase().includes('portland trail blazers')
    );
    
    const blazersDeals = dealScoringService.scoreDeals(blazersEvents);
    
    res.json({
      success: true,
      service: 'deal-scoring',
      team: 'Portland Trail Blazers',
      deals: blazersDeals,
      metadata: {
        count: blazersDeals.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Blazers deals error:', error);
    res.status(500).json({
      success: false,
      service: 'deal-scoring',
      error: 'Failed to fetch Blazers deals'
    });
  }
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Deal scoring service error:', error);
  res.status(500).json({
    success: false,
    service: 'deal-scoring',
    error: 'Internal deal scoring service error'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`📊 Deal Scoring Service running on port ${PORT}`);
  logger.info(`🎯 Real-time deal analysis and price tracking`);
  
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
  logger.info('SIGTERM received, shutting down Deal Scoring service');
  server.close(async () => {
    await MongoDB.disconnect();
    process.exit(0);
  });
});

export default app;
