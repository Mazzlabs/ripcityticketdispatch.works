"use strict";
/**
 * RIP CITY TICKET DISPATCH - Deal Scoring & Analytics Server
 * Dedicated server for deal analysis and price tracking
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./utils/logger"));
const connection_1 = __importDefault(require("./database/connection"));
const dealScoring_1 = require("./services/dealScoring");
const eventAggregation_1 = __importDefault(require("./services/eventAggregation"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8083', 10);
// Initialize services
const dealScoringService = new dealScoring_1.DealScoringService();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: [
        'https://ripcityticketdispatch.works',
        'https://mazzlabs.works',
        'http://localhost:3000'
    ],
    credentials: true
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Higher limit for deal analysis
    message: 'Too many deal analysis requests'
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
// Health check
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await connection_1.default.healthCheck();
        res.json({
            service: 'deal-scoring',
            status: 'healthy',
            database: dbHealth ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
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
        logger_1.default.info('Fetching hot deals', { limit, category });
        // Get events from aggregation service
        const events = await eventAggregation_1.default.searchAllEvents({
            category: category || 'all'
        });
        // Score the deals
        const scoredDeals = dealScoringService.scoreDeals(events);
        // Filter for hot deals (high score)
        const hotDeals = scoredDeals
            .filter(deal => deal.dealScore >= 80)
            .slice(0, parseInt(limit));
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
    }
    catch (error) {
        logger_1.default.error('Hot deals error:', error);
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
        logger_1.default.info('Fetching trending deals');
        const events = await eventAggregation_1.default.searchAllEvents({ category: 'all' });
        const scoredDeals = dealScoringService.scoreDeals(events);
        // Filter for trending deals (good score + recent)
        const trendingDeals = scoredDeals
            .filter(deal => deal.dealScore >= 60)
            .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
            .slice(0, parseInt(limit));
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
    }
    catch (error) {
        logger_1.default.error('Trending deals error:', error);
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
        logger_1.default.info('Analyzing deal', { event_id, venue, price_range });
        // Get comprehensive event data
        const events = await eventAggregation_1.default.searchAllEvents({ category: 'all' });
        // Find specific event or similar events
        const targetEvents = events.filter(event => {
            if (event_id)
                return event.id === event_id;
            if (venue)
                return event.venue?.toLowerCase().includes(venue.toLowerCase());
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
    }
    catch (error) {
        logger_1.default.error('Deal analysis error:', error);
        res.status(500).json({
            success: false,
            service: 'deal-scoring',
            error: 'Failed to analyze deals'
        });
    }
});
app.get('/api/deals/blazers', async (req, res) => {
    try {
        logger_1.default.info('Fetching Blazers deals');
        const events = await eventAggregation_1.default.searchAllEvents({ category: 'sports' });
        // Filter for Blazers events
        const blazersEvents = events.filter(event => event.name?.toLowerCase().includes('blazers') ||
            event.name?.toLowerCase().includes('portland trail blazers'));
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
    }
    catch (error) {
        logger_1.default.error('Blazers deals error:', error);
        res.status(500).json({
            success: false,
            service: 'deal-scoring',
            error: 'Failed to fetch Blazers deals'
        });
    }
});
// Error handling
app.use((error, req, res, next) => {
    logger_1.default.error('Deal scoring service error:', error);
    res.status(500).json({
        success: false,
        service: 'deal-scoring',
        error: 'Internal deal scoring service error'
    });
});
// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
    logger_1.default.info(`📊 Deal Scoring Service running on port ${PORT}`);
    logger_1.default.info(`🎯 Real-time deal analysis and price tracking`);
    try {
        await connection_1.default.connect();
        logger_1.default.info('🗄️ Database connected');
    }
    catch (error) {
        logger_1.default.error('❌ Database connection failed:', error);
        process.exit(1);
    }
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.default.info('SIGTERM received, shutting down Deal Scoring service');
    server.close(async () => {
        await connection_1.default.disconnect();
        process.exit(0);
    });
});
exports.default = app;
