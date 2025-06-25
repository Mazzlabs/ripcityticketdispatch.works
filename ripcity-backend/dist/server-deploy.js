"use strict";
/**
 * RIP CITY TICKET DISPATCH - DEPLOYMENT SERVER
 * Specialized server for deployment environments with environment-specific configurations
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
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./utils/logger"));
// Database connection
const connection_1 = __importDefault(require("./database/connection"));
// Live API Services
const ticketmaster_1 = __importDefault(require("./services/ticketmaster"));
const eventbrite_1 = __importDefault(require("./services/eventbrite"));
const dealScoring_1 = require("./services/dealScoring");
const eventAggregation_1 = __importDefault(require("./services/eventAggregation"));
// Routes
const users_1 = __importDefault(require("./routes/users"));
const deals_1 = __importDefault(require("./routes/deals"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const smsConsent_1 = __importDefault(require("./routes/smsConsent"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8080', 10);
const NODE_ENV = process.env.NODE_ENV || 'deployment';
// Initialize services
const dealScoringService = new dealScoring_1.DealScoringService();
// Deployment-specific security configuration
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
            imgSrc: ["'self'", "data:", "https:", "https://*.ticketmaster.com", "https://*.eventbrite.com"],
            connectSrc: ["'self'", "https://api.mixpanel.com", "https://www.google-analytics.com"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// CORS for deployment environments
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://ripcityticketdispatch.works',
            'https://www.ripcityticketdispatch.works',
            'https://mazzlabs.works',
            'https://mazzlabs.me'
        ];
        // Allow deployment environments and localhost for development
        if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost')) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
// Deployment-specific rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: NODE_ENV === 'production' ? 100 : 500, // Adjust based on deployment environment  
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retry_after: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            environment: NODE_ENV
        });
        res.status(429).json({
            success: false,
            error: 'Too many requests from this IP, please try again later.',
            retry_after: '15 minutes'
        });
    }
});
app.use('/api/', limiter);
// Body parsing middleware
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Deployment health check with environment validation
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await connection_1.default.healthCheck();
        // Validate critical environment variables
        const requiredEnvVars = [
            'MONGODB_URI',
            'JWT_SECRET',
            'TICKETMASTER_KEY',
            'EVENTBRITE_KEY'
        ];
        const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
        // Test live API connections
        let ticketmasterHealth = false;
        let eventbriteHealth = false;
        try {
            if (process.env.TICKETMASTER_KEY) {
                await ticketmaster_1.default.getVenues();
                ticketmasterHealth = true;
            }
        }
        catch (e) {
            logger_1.default.warn('Ticketmaster API check failed in deployment:', e);
        }
        try {
            if (process.env.EVENTBRITE_KEY) {
                await eventbrite_1.default.getPortlandEvents();
                eventbriteHealth = true;
            }
        }
        catch (e) {
            logger_1.default.warn('Eventbrite API check failed in deployment:', e);
        }
        const healthStatus = {
            status: missingEnvVars.length === 0 && dbHealth ? 'ok' : 'warning',
            timestamp: new Date().toISOString(),
            environment: NODE_ENV,
            deployment_ready: missingEnvVars.length === 0,
            services: {
                database: dbHealth ? 'connected' : 'disconnected',
                ticketmaster: ticketmasterHealth ? 'live_api_active' : 'api_error',
                eventbrite: eventbriteHealth ? 'live_api_active' : 'api_error',
                // MVP bypassed services
                stripe: 'bypassed_mvp',
                twilio: 'bypassed_mvp',
                sendgrid: 'bypassed_mvp'
            },
            configuration: {
                missing_env_vars: missingEnvVars,
                api_keys_present: {
                    ticketmaster: !!process.env.TICKETMASTER_KEY,
                    eventbrite: !!process.env.EVENTBRITE_KEY,
                    mongodb: !!process.env.MONGODB_URI,
                    jwt_secret: !!process.env.JWT_SECRET
                }
            }
        };
        if (missingEnvVars.length > 0) {
            logger_1.default.error('Deployment health check failed - missing environment variables:', missingEnvVars);
            return res.status(503).json(healthStatus);
        }
        res.json(healthStatus);
    }
    catch (error) {
        logger_1.default.error('Deployment health check failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            timestamp: new Date().toISOString(),
            environment: NODE_ENV
        });
    }
});
// Deployment info endpoint
app.get('/api/deployment/info', (req, res) => {
    res.json({
        name: 'Rip City Ticket Dispatch API',
        version: '1.0.0',
        environment: NODE_ENV,
        deployment_type: 'live_apis',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            venues: '/api/venues',
            events: '/api/events',
            blazers: '/api/blazers',
            deals: '/api/deals/*',
            legal: '/legal/*'
        },
        features: [
            'Live Ticketmaster API',
            'Live Eventbrite API',
            'Real-time event aggregation',
            'MVP Stripe bypass',
            'MVP Twilio SMS bypass',
            'MongoDB database',
            'CloudFlare CDN ready'
        ]
    });
});
// Live API endpoints using certified APIs
app.get('/api/venues', async (req, res) => {
    try {
        logger_1.default.info('Deployment: Fetching venues from live Ticketmaster API');
        const venues = await ticketmaster_1.default.getVenues();
        res.json({
            success: true,
            venues,
            source: 'ticketmaster_live_api',
            metadata: {
                count: venues.length,
                timestamp: new Date().toISOString(),
                environment: NODE_ENV,
                api_key_status: 'certified'
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('Deployment Ticketmaster API error', { error: errorMessage, environment: NODE_ENV });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch venues from live API',
            environment: NODE_ENV,
            details: NODE_ENV !== 'production' ? errorMessage : undefined
        });
    }
});
// Events aggregation endpoint
app.get('/api/events', async (req, res) => {
    try {
        const { category, limit = '50' } = req.query;
        logger_1.default.info('Deployment: Fetching events from live APIs', { category, limit, environment: NODE_ENV });
        const filters = {
            category: category || 'all'
        };
        const events = await eventAggregation_1.default.searchAllEvents(filters);
        const limitedEvents = events.slice(0, parseInt(limit || '50'));
        res.json({
            success: true,
            events: limitedEvents,
            sources: ['ticketmaster_live', 'eventbrite_live'],
            metadata: {
                total: limitedEvents.length,
                timestamp: new Date().toISOString(),
                api_status: 'live_certified_apis',
                category_filter: category || 'all',
                environment: NODE_ENV
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('Deployment API aggregation error', { error: errorMessage, environment: NODE_ENV });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch events from live APIs',
            environment: NODE_ENV,
            details: NODE_ENV !== 'production' ? errorMessage : undefined
        });
    }
});
// Blazers-specific endpoint
app.get('/api/blazers', async (req, res) => {
    try {
        logger_1.default.info('Deployment: Fetching Trail Blazers events', { environment: NODE_ENV });
        const blazersEvents = await ticketmaster_1.default.getBlazersEvents();
        res.json({
            success: true,
            events: blazersEvents,
            source: 'ticketmaster_live_api',
            metadata: {
                count: blazersEvents.length,
                timestamp: new Date().toISOString(),
                team: 'Portland Trail Blazers',
                environment: NODE_ENV
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('Deployment Blazers API error', { error: errorMessage, environment: NODE_ENV });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Blazers events',
            environment: NODE_ENV
        });
    }
});
// Hot deals endpoint
app.get('/api/deals/hot', async (req, res) => {
    try {
        logger_1.default.info('Deployment: Generating hot deals', { environment: NODE_ENV });
        const hotDeals = await eventAggregation_1.default.getHotDeals(20);
        res.json({
            success: true,
            deals: hotDeals,
            source: 'live_api_aggregation',
            metadata: {
                count: hotDeals.length,
                timestamp: new Date().toISOString(),
                scoring: 'real_time_algorithm',
                environment: NODE_ENV
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('Deployment hot deals error', { error: errorMessage, environment: NODE_ENV });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch hot deals',
            environment: NODE_ENV
        });
    }
});
// API Routes
app.use('/api/users', users_1.default);
app.use('/api/deals', deals_1.default);
app.use('/api/subscriptions', subscriptions_1.default);
app.use('/api/sms-consent', smsConsent_1.default);
// Serve legal documents
app.use('/legal', express_1.default.static(path_1.default.join(__dirname, '../legal-site')));
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Rip City Ticket Dispatch API',
        version: '1.0.0',
        status: 'active',
        description: 'Portland Event Ticket Aggregation API - Deployment Server',
        environment: NODE_ENV,
        deployment_features: [
            'Environment validation',
            'Enhanced security headers',
            'Deployment-specific CORS',
            'Live API health monitoring',
            'Configuration validation'
        ],
        endpoints: {
            health: '/health',
            deployment_info: '/api/deployment/info',
            api: '/api/*',
            legal: '/legal/*'
        },
        timestamp: new Date().toISOString()
    });
});
// 404 handler for API routes
app.get('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        available_endpoints: [
            '/api/venues',
            '/api/events',
            '/api/blazers',
            '/api/deals/hot',
            '/api/deployment/info'
        ],
        environment: NODE_ENV
    });
});
// Legal route handler
app.get('/legal/*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../legal-site/index.html'));
});
// General 404 handler
app.get('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'This is a deployment API server.',
        environment: NODE_ENV,
        api_documentation: '/api/deployment/info'
    });
});
// Error handling middleware
app.use((error, req, res, next) => {
    logger_1.default.error('Deployment server error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        environment: NODE_ENV
    });
    res.status(500).json({
        success: false,
        error: NODE_ENV === 'production' ? 'Internal server error' : error.message,
        environment: NODE_ENV
    });
});
// Start deployment server
const server = app.listen(PORT, '0.0.0.0', async () => {
    logger_1.default.info(`🚀 Rip City DEPLOYMENT Server running on port ${PORT}`);
    logger_1.default.info(`🏀 Environment: ${NODE_ENV}`);
    logger_1.default.info(`🌐 Domain: ripcityticketdispatch.works (via Cloudflare)`);
    logger_1.default.info(`☁️  Hosting: DigitalOcean`);
    logger_1.default.info(`🍃 Database: MongoDB (DigitalOcean)`);
    logger_1.default.info(`🎫 Ticketmaster API: ${process.env.TICKETMASTER_KEY ? 'LIVE & CERTIFIED ✅' : 'MISSING ❌'}`);
    logger_1.default.info(`🎪 Eventbrite API: ${process.env.EVENTBRITE_KEY ? 'LIVE & CERTIFIED ✅' : 'MISSING ❌'}`);
    logger_1.default.info(`💳 Stripe: BYPASSED FOR MVP`);
    logger_1.default.info(`📱 Twilio SMS: BYPASSED FOR MVP`);
    logger_1.default.info(`📧 SendGrid: BYPASSED FOR MVP`);
    logger_1.default.info(`🔧 Server Type: DEPLOYMENT (Environment validation & security)`);
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
// Graceful shutdown handling
process.on('SIGTERM', async () => {
    logger_1.default.info('SIGTERM received, shutting down deployment server gracefully');
    server.close(async () => {
        await connection_1.default.disconnect();
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    logger_1.default.info('SIGINT received, shutting down deployment server gracefully');
    server.close(async () => {
        await connection_1.default.disconnect();
        process.exit(0);
    });
});
exports.default = app;
