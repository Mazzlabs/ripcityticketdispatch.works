"use strict";
/**
 * RIP CITY TICKET DISPATCH - LIVE API SERVER
 * Clean implementation with working Ticketmaster & Eventbrite APIs
 * MVP ready: Stripe/Twilio/SendGrid bypassed until approval
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
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Database and utilities
const connection_1 = __importDefault(require("./database/connection"));
const logger_1 = __importDefault(require("./utils/logger"));
// Services - Live APIs
const ticketmaster_1 = __importDefault(require("./services/ticketmaster"));
const eventbrite_1 = __importDefault(require("./services/eventbrite"));
const dealScoring_1 = require("./services/dealScoring");
const eventAggregation_1 = __importDefault(require("./services/eventAggregation"));
// Routes
const users_1 = __importDefault(require("./routes/users"));
const deals_1 = __importDefault(require("./routes/deals"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const smsConsent_1 = __importDefault(require("./routes/smsConsent"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8080', 10);
// Initialize services
const dealScoringService = new dealScoring_1.DealScoringService();
// Security & Performance
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
            imgSrc: ["'self'", "data:", "https:", "https://*.ticketmaster.com", "https://*.eventbrite.com"],
            connectSrc: ["'self'", "https://api.mixpanel.com", "https://www.google-analytics.com"]
        }
    }
}));
// CORS for CloudFlare deployment
const corsOptions = {
    origin: [
        'https://ripcityticketdispatch.works',
        'https://mazzlabs.works',
        'http://localhost:3000' // Development
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
// Rate limiting for API protection
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// Body parsing
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check with service status
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await connection_1.default.healthCheck();
        // Test live API connections
        let ticketmasterHealth = false;
        let eventbriteHealth = false;
        try {
            const venues = await ticketmaster_1.default.getVenues();
            ticketmasterHealth = venues && venues.length > 0;
        }
        catch (e) {
            logger_1.default.warn('Ticketmaster API check failed:', e);
        }
        try {
            const events = await eventbrite_1.default.getPortlandEvents();
            eventbriteHealth = events && events.length > 0;
        }
        catch (e) {
            logger_1.default.warn('Eventbrite API check failed:', e);
        }
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: dbHealth ? 'connected' : 'disconnected',
                ticketmaster: ticketmasterHealth ? 'live_api_active' : 'api_error',
                eventbrite: eventbriteHealth ? 'live_api_active' : 'api_error',
                // MVP bypassed services
                stripe: 'bypassed_mvp',
                twilio: 'bypassed_mvp',
                sendgrid: 'bypassed_mvp'
            },
            environment: process.env.NODE_ENV || 'development',
            api_keys: {
                ticketmaster: !!process.env.TICKETMASTER_KEY,
                eventbrite: !!process.env.EVENTBRITE_KEY
            }
        });
    }
    catch (error) {
        logger_1.default.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});
// Live API Endpoints
// Get Portland venues from Ticketmaster
app.get('/api/venues', async (req, res) => {
    try {
        logger_1.default.info('Fetching venues from live Ticketmaster API');
        const venues = await ticketmaster_1.default.getVenues();
        res.json({
            success: true,
            venues,
            source: 'ticketmaster_live_api',
            metadata: {
                count: venues.length,
                timestamp: new Date().toISOString(),
                api_key_status: 'certified'
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('Live Ticketmaster API error', { error: errorMessage });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch venues from live API',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
});
// Get live events from multiple APIs
app.get('/api/events', async (req, res) => {
    try {
        const { category, limit = '50' } = req.query;
        logger_1.default.info('Fetching events from live APIs', { category, limit });
        // Use real event aggregation service
        const filters = {
            category: category || 'all'
        };
        const events = await eventAggregation_1.default.searchAllEvents(filters);
        const limitedEvents = events.slice(0, parseInt(limit));
        res.json({
            success: true,
            events: limitedEvents,
            metadata: {
                total: events.length,
                returned: limitedEvents.length,
                category: filters.category,
                source: 'live_apis_aggregated',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error('Live events API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch events from live APIs'
        });
    }
});
// Live deal discovery
app.get('/api/deals/hot', async (req, res) => {
    try {
        logger_1.default.info('Fetching hot deals from live APIs');
        // Get events directly from Ticketmaster API (proper type)
        const ticketmasterEvents = await ticketmaster_1.default.searchEvents({
            city: 'Portland',
            size: '50'
        });
        // Score deals using real algorithm (expects TicketmasterEvent[])
        const scoredDeals = dealScoringService.scoreDeals(ticketmasterEvents);
        // Filter for hot deals (dealScore > 80)
        const hotDeals = scoredDeals
            .filter(deal => deal.dealScore > 80)
            .slice(0, 20);
        res.json({
            success: true,
            deals: hotDeals,
            metadata: {
                total_analyzed: ticketmasterEvents.length,
                hot_deals_found: hotDeals.length,
                min_score: 80,
                source: 'ticketmaster_live_api',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error('Hot deals API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch hot deals'
        });
    }
});
// Portland Trail Blazers specific endpoint
app.get('/api/blazers', async (req, res) => {
    try {
        logger_1.default.info('Fetching Portland Trail Blazers events');
        // Search specifically for Blazers games
        const blazersEvents = await ticketmaster_1.default.searchEvents({
            keyword: 'Portland Trail Blazers',
            city: 'Portland',
            classificationName: 'Basketball'
        });
        const deals = dealScoringService.scoreDeals(blazersEvents);
        res.json({
            success: true,
            games: deals,
            metadata: {
                team: 'Portland Trail Blazers',
                venue: 'Moda Center',
                source: 'ticketmaster_live_api',
                count: deals.length,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error('Blazers API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Blazers games'
        });
    }
});
// API Routes with live data
app.use('/api/users', users_1.default);
app.use('/api/deals', deals_1.default);
// MVP Bypass Routes - Mock responses until approval
app.use('/api/subscriptions', (req, res, next) => {
    logger_1.default.info('MVP: Subscription request intercepted - Stripe bypassed');
    req.headers['x-mvp-mode'] = 'true';
    next();
}, subscriptions_1.default);
app.use('/api/sms-consent', (req, res, next) => {
    logger_1.default.info('MVP: SMS consent request intercepted - Twilio bypassed');
    req.headers['x-mvp-mode'] = 'true';
    next();
}, smsConsent_1.default);
// Serve legal documents (required for API approvals)
app.use('/legal', express_1.default.static(path_1.default.join(__dirname, '../legal-site')));
// Serve React frontend
app.use(express_1.default.static(path_1.default.join(__dirname, 'frontend')));
// Catch-all handler for React Router
app.get('*', (req, res) => {
    // API routes return 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'API endpoint not found',
            available_endpoints: [
                '/api/venues',
                '/api/events',
                '/api/blazers',
                '/api/deals/hot',
                '/api/users',
                '/api/subscriptions (MVP bypassed)',
                '/api/sms-consent (MVP bypassed)'
            ]
        });
    }
    // Legal routes
    if (req.path.startsWith('/legal/')) {
        return res.sendFile(path_1.default.join(__dirname, '../legal-site/index.html'));
    }
    // Serve React app
    res.sendFile(path_1.default.join(__dirname, 'frontend/index.html'));
});
// Error handling middleware
app.use((error, req, res, next) => {
    logger_1.default.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
});
// Graceful shutdown
const server = app.listen(PORT, '0.0.0.0', async () => {
    logger_1.default.info(`🚀 Rip City LIVE API Server running on port ${PORT}`);
    logger_1.default.info(`🏀 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger_1.default.info(`🌐 Domain: ripcityticketdispatch.works (via CloudFlare)`);
    logger_1.default.info(`☁️  Hosting: DigitalOcean`);
    logger_1.default.info(`🍃 Database: MongoDB`);
    logger_1.default.info(`🎫 Ticketmaster API: ${process.env.TICKETMASTER_KEY ? 'LIVE & CERTIFIED ✅' : 'MISSING ❌'}`);
    logger_1.default.info(`🎪 Eventbrite API: ${process.env.EVENTBRITE_KEY ? 'LIVE & CERTIFIED ✅' : 'MISSING ❌'}`);
    logger_1.default.info(`💳 Stripe: BYPASSED FOR MVP (awaiting approval)`);
    logger_1.default.info(`📱 Twilio SMS: BYPASSED FOR MVP (awaiting approval)`);
    logger_1.default.info(`📧 SendGrid: BYPASSED FOR MVP (awaiting approval)`);
    // Initialize database connection
    try {
        await connection_1.default.connect();
        logger_1.default.info('🗄️ MongoDB connection established');
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
