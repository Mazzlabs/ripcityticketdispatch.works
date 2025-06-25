"use strict";
/**
 * RIP CITY TICKET DISPATCH - PRODUCTION SERVER
 * Full production deployment with all security features
 * CloudFlare + DigitalOcean optimized
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
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
// Database and utilities
const connection_1 = __importDefault(require("./database/connection"));
const logger_1 = __importDefault(require("./utils/logger"));
// Services
const ticketmaster_1 = __importDefault(require("./services/ticketmaster"));
const dealScoring_1 = require("./services/dealScoring");
// Routes
const users_1 = __importDefault(require("./routes/users"));
const deals_1 = __importDefault(require("./routes/deals"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const smsConsent_1 = __importDefault(require("./routes/smsConsent"));
// Middleware
const auth_1 = require("./middleware/auth");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8080', 10);
// Initialize services
const dealScoringService = new dealScoring_1.DealScoringService();
// Production Security Headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.mixpanel.com", "https://www.google-analytics.com"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
// Strict Rate Limiting for Production
const strictLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', strictLimiter);
// CORS for production domains only
const corsOptions = {
    origin: process.env.CORS_ORIGINS?.split(',') || [
        'https://ripcityticketdispatch.works',
        'https://mazzlabs.works'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
// Body parsing with limits
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '5mb' })); // Smaller limit for production
app.use(express_1.default.urlencoded({ extended: true, limit: '5mb' }));
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await connection_1.default.healthCheck();
        const services = {
            database: dbHealth ? 'connected' : 'disconnected',
            ticketmaster: !!process.env.TICKETMASTER_KEY,
            eventbrite: !!process.env.EVENTBRITE_KEY,
            stripe: !!process.env.STRIPE_SECRET,
            twilio: !!process.env.TWILIO_ACCOUNT_SID,
            sendgrid: !!process.env.SENDGRID_API_KEY
        };
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            services,
            version: '1.0.0'
        });
    }
    catch (error) {
        logger_1.default.error('Health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Service health check failed'
        });
    }
});
// API Routes
app.use('/api/users', users_1.default);
app.use('/api/deals', deals_1.default);
app.use('/api/subscriptions', subscriptions_1.default);
app.use('/api/sms-consent', smsConsent_1.default);
// Venues endpoint
app.get('/api/venues', async (req, res) => {
    try {
        logger_1.default.info('Fetching Portland venues');
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
        logger_1.default.error('Error fetching venues', { error: errorMessage });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch venues'
        });
    }
});
// Premium API endpoint - requires subscription
app.get('/api/premium/deals', auth_1.authenticateToken, (0, auth_1.requireSubscription)('premium'), async (req, res) => {
    try {
        const { city = 'portland', category, minPrice, maxPrice, limit = 50 } = req.query;
        logger_1.default.info('Fetching premium deals', {
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
            premium: true,
            historicalData: {
                averagePrice: deal.originalPrice * 1.1,
                priceHistory: [], // Would come from database
                trendAnalysis: 'stable'
            },
            advancedMetrics: {
                popularityScore: Math.floor(Math.random() * 100),
                demandLevel: 'high',
                priceVolatility: 'low'
            }
        }));
        res.json({
            success: true,
            deals: premiumDeals,
            metadata: {
                total: premiumDeals.length,
                userTier: req.user?.tier,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('Error fetching premium deals', { error: errorMessage, userId: req.user?.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch premium deals'
        });
    }
});
// Serve legal documents (critical for API approvals)
app.use('/legal', express_1.default.static(path_1.default.join(__dirname, '..', '..', 'legal-site')));
// Serve React frontend
app.use(express_1.default.static(path_1.default.join(__dirname, 'frontend')));
// Catch-all handler for React Router
app.get('*', (req, res) => {
    // If it's an API route, return 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'API endpoint not found'
        });
    }
    // For legal routes, serve legal site
    if (req.path.startsWith('/legal/')) {
        return res.sendFile(path_1.default.join(__dirname, '..', '..', 'legal-site', 'index.html'));
    }
    // Otherwise serve React app
    const frontendPath = path_1.default.join(__dirname, 'frontend', 'index.html');
    if (require('fs').existsSync(frontendPath)) {
        res.sendFile(frontendPath);
    }
    else {
        res.status(404).json({
            success: false,
            error: 'Frontend not found - build the React app first'
        });
    }
});
// Error handling middleware
app.use((error, req, res, next) => {
    logger_1.default.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
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
    logger_1.default.info(`🚀 Rip City Events Hub running on port ${PORT}`);
    logger_1.default.info(`🏀 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger_1.default.info(`🌹 Portland Event Ticket Discovery Platform`);
    logger_1.default.info(`🔑 Ticketmaster API: ${process.env.TICKETMASTER_KEY ? 'Configured' : 'Missing'}`);
    logger_1.default.info(`🎫 Eventbrite API: ${process.env.EVENTBRITE_KEY ? 'Configured' : 'Missing'}`);
    logger_1.default.info(`💳 Stripe: ${process.env.STRIPE_SECRET ? 'Configured' : 'Pending Approval'}`);
    logger_1.default.info(`📱 Twilio SMS: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Pending Approval'}`);
    logger_1.default.info(`📧 SendGrid: ${process.env.SENDGRID_API_KEY ? 'Configured' : 'Pending Approval'}`);
    // Initialize database
    try {
        await connection_1.default.connect();
        logger_1.default.info('🗄️ Database connection established');
    }
    catch (error) {
        logger_1.default.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
});
// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully');
    server.close(async () => {
        await connection_1.default.disconnect();
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    logger_1.default.info('SIGINT received, shutting down gracefully');
    server.close(async () => {
        await connection_1.default.disconnect();
        process.exit(0);
    });
});
exports.default = app;
