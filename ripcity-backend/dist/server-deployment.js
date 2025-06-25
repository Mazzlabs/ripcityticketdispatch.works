"use strict";
/**
 * RIP CITY TICKET DISPATCH - DEPLOYMENT SERVER
 * Deployment-ready server with Twilio, SendGrid, and Stripe disabled
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
const connection_1 = __importDefault(require("./database/connection"));
const logger_1 = __importDefault(require("./utils/logger"));
// Import routes
const users_1 = __importDefault(require("./routes/users"));
const deals_1 = __importDefault(require("./routes/deals"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const smsConsent_1 = __importDefault(require("./routes/smsConsent"));
// Import services (but disable payment/messaging)
const eventbrite_1 = __importDefault(require("./services/eventbrite"));
const ticketmaster_1 = __importDefault(require("./services/ticketmaster"));
const dealScoring_1 = require("./services/dealScoring");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "https://www.googletagmanager.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.mixpanel.com", "https://www.google-analytics.com"]
        }
    }
}));
// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
// Compression and parsing
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await connection_1.default.healthCheck();
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbHealth ? 'connected' : 'disconnected',
            services: {
                mongodb: dbHealth,
                ticketmaster: true,
                eventbrite: true,
                // Note: Stripe, Twilio, SendGrid disabled for deployment
                stripe: 'disabled',
                twilio: 'disabled',
                sendgrid: 'disabled'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed'
        });
    }
});
// API routes
app.use('/api/users', users_1.default);
app.use('/api/deals', deals_1.default);
app.use('/api/subscriptions', subscriptions_1.default);
app.use('/api/sms-consent', smsConsent_1.default);
// Serve legal documents
app.use('/legal', express_1.default.static(path_1.default.join(__dirname, '../legal-site')));
// Serve React frontend
app.use(express_1.default.static(path_1.default.join(__dirname, 'frontend')));
// Catch-all handler for React Router
app.get('*', (req, res) => {
    // If it's an API route, return 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    // For legal routes, serve legal site
    if (req.path.startsWith('/legal/')) {
        return res.sendFile(path_1.default.join(__dirname, '../legal-site/index.html'));
    }
    // Otherwise serve React app
    res.sendFile(path_1.default.join(__dirname, 'frontend/index.html'));
});
// Error handling middleware
app.use((error, req, res, next) => {
    logger_1.default.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
// Modified Alert Service for deployment (no actual sending)
class DeploymentAlertService {
    async processDeals(deals) {
        logger_1.default.info(`🎯 Processing ${deals.length} deals for alerts (deployment mode)`);
        const dealScoringService = new dealScoring_1.DealScoringService();
        for (const deal of deals) {
            const scoredDeals = dealScoringService.scoreDeals([deal]);
            if (scoredDeals.length > 0 && scoredDeals[0].dealScore > 70) {
                logger_1.default.info(`🔥 High-value deal detected: ${deal.name || deal.title} (Score: ${scoredDeals[0].dealScore})`);
                // In deployment: just log, don't send actual alerts
                await this.logAlert(deal, scoredDeals[0].dealScore);
            }
        }
    }
    async logAlert(deal, score) {
        logger_1.default.info(`📧 [DEPLOYMENT] Would send alert for: ${deal.title}`);
        logger_1.default.info(`📱 [DEPLOYMENT] Deal score: ${score}`);
        logger_1.default.info(`💰 [DEPLOYMENT] Price: ${deal.price}`);
        // Save to database but don't actually send
        try {
            await connection_1.default.addAlertHistory('deployment-user', deal.id, 'deal-alert');
        }
        catch (error) {
            logger_1.default.error('Failed to log alert to database:', error);
        }
    }
}
// Initialize services
const alertService = new DeploymentAlertService();
// Services are already instantiated and imported above
// Background job for ticket monitoring (but limited for deployment)
async function runTicketMonitoring() {
    try {
        logger_1.default.info('🎫 Starting ticket monitoring cycle...');
        // Get deals from Eventbrite
        const eventbriteDeals = await eventbrite_1.default.searchEvents({
            location: 'Portland, OR',
            name_filter: 'Trail Blazers'
        });
        logger_1.default.info(`Found ${eventbriteDeals.length} Eventbrite deals`);
        // Get deals from Ticketmaster
        const ticketmasterDeals = await ticketmaster_1.default.searchEvents({
            city: 'Portland',
            keyword: 'Trail Blazers'
        });
        logger_1.default.info(`Found ${ticketmasterDeals.length} Ticketmaster deals`);
        // Combine and process deals
        const allDeals = [...eventbriteDeals, ...ticketmasterDeals];
        // Process through alert system (deployment mode)
        await alertService.processDeals(allDeals);
        logger_1.default.info('✅ Ticket monitoring cycle completed');
    }
    catch (error) {
        logger_1.default.error('❌ Ticket monitoring failed:', error);
    }
}
// Start server
async function startServer() {
    try {
        // Connect to MongoDB
        await connection_1.default.connect();
        logger_1.default.info('🍃 MongoDB connected successfully');
        // Start HTTP server
        app.listen(PORT, () => {
            logger_1.default.info(`🚀 Rip City Ticket Dispatch Server running on port ${PORT}`);
            logger_1.default.info(`🌐 Environment: ${process.env.NODE_ENV}`);
            logger_1.default.info(`📋 Legal docs: http://localhost:${PORT}/legal`);
            logger_1.default.info(`💻 Frontend: http://localhost:${PORT}`);
            logger_1.default.info(`⚠️  Deployment mode: Stripe, Twilio, SendGrid disabled`);
        });
        // Start background monitoring (limited frequency for deployment)
        setInterval(runTicketMonitoring, 10 * 60 * 1000); // Every 10 minutes
        // Run initial monitoring
        setTimeout(runTicketMonitoring, 5000); // After 5 seconds
    }
    catch (error) {
        logger_1.default.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully');
    await connection_1.default.disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.default.info('SIGINT received, shutting down gracefully');
    await connection_1.default.disconnect();
    process.exit(0);
});
// Start the server
startServer();
