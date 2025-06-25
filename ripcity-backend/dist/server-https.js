"use strict";
/**
 * RIP CITY TICKET DISPATCH - HTTPS SERVER
 * HTTPS-enabled server with SSL/TLS certificate support
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
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
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '8080', 10);
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '8443', 10);
// Initialize services
const dealScoringService = new dealScoring_1.DealScoringService();
// SSL Certificate paths
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path_1.default.join(__dirname, '../../ripcityticketdispatch.works.key');
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path_1.default.join(__dirname, '../../ripcityticketdispatch.works.pem');
// Check for SSL certificates
let sslCredentials = null;
try {
    if (fs_1.default.existsSync(SSL_KEY_PATH) && fs_1.default.existsSync(SSL_CERT_PATH)) {
        sslCredentials = {
            key: fs_1.default.readFileSync(SSL_KEY_PATH, 'utf8'),
            cert: fs_1.default.readFileSync(SSL_CERT_PATH, 'utf8')
        };
        logger_1.default.info('SSL certificates loaded successfully');
    }
    else {
        logger_1.default.warn('SSL certificates not found, HTTPS server will not start');
    }
}
catch (error) {
    logger_1.default.error('Failed to load SSL certificates:', error);
}
// Force HTTPS middleware (for production)
const forceHTTPS = (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }
    next();
};
// Security headers for HTTPS
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
            upgradeInsecureRequests: [],
            blockAllMixedContent: []
        }
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// HTTPS CORS configuration
const corsOptions = {
    origin: [
        'https://ripcityticketdispatch.works',
        'https://www.ripcityticketdispatch.works',
        'https://mazzlabs.works',
        'https://mazzlabs.me',
        ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://localhost:3001'] : [])
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use(forceHTTPS);
}
// Rate limiting for HTTPS server
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 500,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retry_after: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// Body parsing middleware
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// HTTPS health check
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await connection_1.default.healthCheck();
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
            logger_1.default.warn('Ticketmaster API check failed:', e);
        }
        try {
            if (process.env.EVENTBRITE_KEY) {
                await eventbrite_1.default.getPortlandEvents();
                eventbriteHealth = true;
            }
        }
        catch (e) {
            logger_1.default.warn('Eventbrite API check failed:', e);
        }
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            protocol: req.secure ? 'https' : 'http',
            ssl_enabled: !!sslCredentials,
            services: {
                database: dbHealth ? 'connected' : 'disconnected',
                ticketmaster: ticketmasterHealth ? 'live_api_active' : 'api_error',
                eventbrite: eventbriteHealth ? 'live_api_active' : 'api_error',
                stripe: 'bypassed_mvp',
                twilio: 'bypassed_mvp',
                sendgrid: 'bypassed_mvp'
            },
            environment: process.env.NODE_ENV || 'development',
            security: {
                https_enabled: !!sslCredentials,
                hsts_enabled: process.env.NODE_ENV === 'production',
                force_https: process.env.NODE_ENV === 'production'
            }
        });
    }
    catch (error) {
        logger_1.default.error('HTTPS health check failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            timestamp: new Date().toISOString(),
            protocol: req.secure ? 'https' : 'http'
        });
    }
});
// SSL Certificate info endpoint
app.get('/api/ssl/info', (req, res) => {
    res.json({
        ssl_enabled: !!sslCredentials,
        certificates_loaded: !!sslCredentials,
        key_path: SSL_KEY_PATH,
        cert_path: SSL_CERT_PATH,
        https_port: HTTPS_PORT,
        http_port: HTTP_PORT,
        force_https: process.env.NODE_ENV === 'production',
        timestamp: new Date().toISOString()
    });
});
// Live API endpoints
app.get('/api/venues', async (req, res) => {
    try {
        logger_1.default.info('HTTPS: Fetching venues from live Ticketmaster API');
        const venues = await ticketmaster_1.default.getVenues();
        res.json({
            success: true,
            venues,
            source: 'ticketmaster_live_api',
            metadata: {
                count: venues.length,
                timestamp: new Date().toISOString(),
                protocol: req.secure ? 'https' : 'http',
                api_key_status: 'certified'
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('HTTPS Ticketmaster API error', { error: errorMessage });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch venues from live API',
            protocol: req.secure ? 'https' : 'http',
            details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined
        });
    }
});
// Events endpoint with HTTPS context
app.get('/api/events', async (req, res) => {
    try {
        const { category, limit = '50' } = req.query;
        logger_1.default.info('HTTPS: Fetching events from live APIs', { category, limit });
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
                protocol: req.secure ? 'https' : 'http',
                api_status: 'live_certified_apis',
                category_filter: category || 'all'
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('HTTPS API aggregation error', { error: errorMessage });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch events from live APIs',
            protocol: req.secure ? 'https' : 'http',
            details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined
        });
    }
});
// Blazers endpoint
app.get('/api/blazers', async (req, res) => {
    try {
        logger_1.default.info('HTTPS: Fetching Trail Blazers events');
        const blazersEvents = await ticketmaster_1.default.getBlazersEvents();
        res.json({
            success: true,
            events: blazersEvents,
            source: 'ticketmaster_live_api',
            metadata: {
                count: blazersEvents.length,
                timestamp: new Date().toISOString(),
                protocol: req.secure ? 'https' : 'http',
                team: 'Portland Trail Blazers'
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('HTTPS Blazers API error', { error: errorMessage });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Blazers events',
            protocol: req.secure ? 'https' : 'http'
        });
    }
});
// Hot deals endpoint
app.get('/api/deals/hot', async (req, res) => {
    try {
        logger_1.default.info('HTTPS: Generating hot deals');
        const hotDeals = await eventAggregation_1.default.getHotDeals(20);
        res.json({
            success: true,
            deals: hotDeals,
            source: 'live_api_aggregation',
            metadata: {
                count: hotDeals.length,
                timestamp: new Date().toISOString(),
                protocol: req.secure ? 'https' : 'http',
                scoring: 'real_time_algorithm'
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('HTTPS hot deals error', { error: errorMessage });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch hot deals',
            protocol: req.secure ? 'https' : 'http'
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
        description: 'Portland Event Ticket Aggregation API - HTTPS Server',
        protocol: req.secure ? 'https' : 'http',
        ssl_enabled: !!sslCredentials,
        endpoints: {
            health: '/health',
            ssl_info: '/api/ssl/info',
            api: '/api/*',
            legal: '/legal/*'
        },
        security_features: [
            'SSL/TLS encryption',
            'HSTS headers',
            'Force HTTPS redirect',
            'Enhanced CSP headers',
            'Mixed content blocking'
        ],
        timestamp: new Date().toISOString()
    });
});
// 404 handlers
app.get('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        protocol: req.secure ? 'https' : 'http',
        available_endpoints: [
            '/api/venues',
            '/api/events',
            '/api/blazers',
            '/api/deals/hot',
            '/api/ssl/info'
        ]
    });
});
app.get('/legal/*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../legal-site/index.html'));
});
app.get('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'This is an HTTPS API server.',
        protocol: req.secure ? 'https' : 'http',
        api_documentation: '/api/ssl/info'
    });
});
// Error handling middleware
app.use((error, req, res, next) => {
    logger_1.default.error('HTTPS server error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        protocol: req.secure ? 'https' : 'http'
    });
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        protocol: req.secure ? 'https' : 'http'
    });
});
// Start servers
let httpServer;
let httpsServer = null;
const startServers = async () => {
    // Start HTTP server
    httpServer = http_1.default.createServer(app);
    httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
        logger_1.default.info(`🌐 HTTP Server running on port ${HTTP_PORT}`);
    });
    // Start HTTPS server if certificates are available
    if (sslCredentials) {
        httpsServer = https_1.default.createServer(sslCredentials, app);
        httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
            logger_1.default.info(`🔒 HTTPS Server running on port ${HTTPS_PORT}`);
        });
    }
    logger_1.default.info(`🚀 Rip City HTTPS Server started`);
    logger_1.default.info(`🏀 Environment: ${process.env.NODE_ENV}`);
    logger_1.default.info(`🌐 HTTP Port: ${HTTP_PORT}`);
    logger_1.default.info(`🔒 HTTPS Port: ${HTTPS_PORT} ${sslCredentials ? '✅' : '❌ (No certificates)'}`);
    logger_1.default.info(`🍃 Database: MongoDB (DigitalOcean)`);
    logger_1.default.info(`🎫 Ticketmaster API: ${process.env.TICKETMASTER_KEY ? 'LIVE & CERTIFIED ✅' : 'MISSING ❌'}`);
    logger_1.default.info(`🎪 Eventbrite API: ${process.env.EVENTBRITE_KEY ? 'LIVE & CERTIFIED ✅' : 'MISSING ❌'}`);
    logger_1.default.info(`🔧 Server Type: HTTPS (SSL/TLS enabled)`);
    // Initialize database connection
    try {
        await connection_1.default.connect();
        logger_1.default.info('🗄️ MongoDB connection established');
    }
    catch (error) {
        logger_1.default.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
};
// Graceful shutdown handling
const shutdown = async () => {
    logger_1.default.info('Shutting down HTTPS server gracefully');
    if (httpServer) {
        httpServer.close();
    }
    if (httpsServer) {
        httpsServer.close();
    }
    await connection_1.default.disconnect();
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Start the servers
startServers().catch(error => {
    logger_1.default.error('Failed to start HTTPS server:', error);
    process.exit(1);
});
exports.default = app;
