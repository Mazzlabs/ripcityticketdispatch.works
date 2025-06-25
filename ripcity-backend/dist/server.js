"use strict";
/**
 * RIP CITY TICKET DISPATCH - Server
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const ticketmaster_1 = __importDefault(require("./services/ticketmaster"));
const connection_1 = __importDefault(require("./database/connection"));
const dealScoring_1 = require("./services/dealScoring");
const users_1 = __importDefault(require("./routes/users"));
const deals_1 = __importDefault(require("./routes/deals"));
const payments_1 = __importDefault(require("./routes/payments"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const auth_1 = require("./middleware/auth");
// Load environment variables
dotenv_1.default.config();
// Initialize logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console()
        // Remove file logging for containerized deployment
    ]
});
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8080', 10);
// Initialize services with fallback for missing API key
const dealScoringService = new dealScoring_1.DealScoringService();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: [
        'https://ripcityticketdispatch.works',
        'https://mazzlabs.works',
        'http://localhost:3000'
    ]
}));
app.use(express_1.default.json());
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// Premium API endpoint - requires subscription
app.get('/api/premium/deals', auth_1.authenticateToken, (0, auth_1.requireSubscription)('premium'), async (req, res) => {
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
        const events = await ticketmaster_1.default.searchEvents({
            city: city,
            classificationName: category,
            minPrice: minPrice,
            maxPrice: maxPrice
        });
        const deals = dealScoringService.scoreDeals(events);
        // Premium features: more deals, historical data, advanced filtering
        const premiumDeals = deals
            .slice(0, parseInt(limit))
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
    }
    catch (error) {
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
        const venues = await ticketmaster_1.default.getVenues();
        res.json({
            success: true,
            venues,
            metadata: {
                count: venues.length,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error fetching venues', { error: errorMessage });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch venues'
        });
    }
});
// API Routes
app.use('/api/deals', deals_1.default);
app.use('/api/users', users_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/subscriptions', subscriptions_1.default);
// Import and add SMS consent routes
const smsConsent_1 = __importDefault(require("./routes/smsConsent"));
app.use('/api/sms-consent', smsConsent_1.default);
// Serve static files from the React build directory
app.use(express_1.default.static(path_1.default.join(__dirname, 'frontend')));
// Serve legal documents
app.use('/legal', express_1.default.static(path_1.default.join(__dirname, '..', '..', 'legal-site')));
// Serve root static files (fallback to root level)
app.use(express_1.default.static(path_1.default.join(__dirname, '..', '..')));
// Catch-all for React app routing - serve index.html for non-API routes
app.get('*', (req, res, next) => {
    // Skip API routes and legal routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/legal/')) {
        return next();
    }
    // Serve the React app index.html
    const reactIndexPath = path_1.default.join(__dirname, 'frontend', 'index.html');
    if (require('fs').existsSync(reactIndexPath)) {
        res.sendFile(reactIndexPath);
    }
    else {
        res.status(404).json({
            success: false,
            error: 'Frontend not found'
        });
    }
});
// Error handling
app.use((error, req, res, next) => {
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
const server = app.listen(PORT, '0.0.0.0', async () => {
    logger.info(`🚀 Rip City Backend running on port ${PORT}`);
    logger.info(`🏀 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔑 Ticketmaster API configured: ${!!process.env.TICKETMASTER_API_KEY}`);
    // Initialize database
    try {
        await connection_1.default.connect();
        logger.info('🗄️ Database connection established');
    }
    catch (error) {
        logger.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
});
// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(async () => {
        try {
            await connection_1.default.disconnect();
            logger.info('Database connection closed');
        }
        catch (error) {
            logger.error('Error closing database:', error);
        }
        logger.info('Process terminated');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(async () => {
        try {
            await connection_1.default.disconnect();
            logger.info('Database connection closed');
        }
        catch (error) {
            logger.error('Error closing database:', error);
        }
        logger.info('Process terminated');
        process.exit(0);
    });
});
exports.default = app;
