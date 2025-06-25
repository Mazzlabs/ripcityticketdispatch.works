"use strict";
/**
 * RIP CITY TICKET DISPATCH - Live Ticketmaster API Server
 * Dedicated server for Ticketmaster API integration
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
const ticketmaster_1 = __importDefault(require("./services/ticketmaster"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8081', 10);
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
// Rate limiting for API protection
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Higher limit for Ticketmaster service
    message: 'Too many Ticketmaster API requests'
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
// Health check
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await connection_1.default.healthCheck();
        const apiStatus = !!process.env.TICKETMASTER_KEY;
        res.json({
            service: 'ticketmaster-api',
            status: 'healthy',
            database: dbHealth ? 'connected' : 'disconnected',
            ticketmaster_api: apiStatus ? 'configured' : 'missing_key',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            service: 'ticketmaster-api',
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Ticketmaster-specific endpoints
app.get('/api/ticketmaster/venues', async (req, res) => {
    try {
        const { city = 'Portland' } = req.query;
        logger_1.default.info('Fetching Ticketmaster venues', { city });
        const venues = await ticketmaster_1.default.getVenues(city);
        res.json({
            success: true,
            service: 'ticketmaster',
            venues,
            metadata: {
                count: venues.length,
                city,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error('Ticketmaster venues error:', error);
        res.status(500).json({
            success: false,
            service: 'ticketmaster',
            error: 'Failed to fetch venues from Ticketmaster API'
        });
    }
});
app.get('/api/ticketmaster/events', async (req, res) => {
    try {
        const { city = 'Portland', keyword, classificationName, startDateTime, size = '20' } = req.query;
        logger_1.default.info('Fetching Ticketmaster events', {
            city, keyword, classificationName, size
        });
        const events = await ticketmaster_1.default.searchEvents({
            city: city,
            keyword: keyword,
            classificationName: classificationName,
            startDateTime: startDateTime,
            size: size
        });
        res.json({
            success: true,
            service: 'ticketmaster',
            events,
            metadata: {
                count: events.length,
                city,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error('Ticketmaster events error:', error);
        res.status(500).json({
            success: false,
            service: 'ticketmaster',
            error: 'Failed to fetch events from Ticketmaster API'
        });
    }
});
app.get('/api/ticketmaster/blazers', async (req, res) => {
    try {
        logger_1.default.info('Fetching Portland Trail Blazers events');
        const blazersEvents = await ticketmaster_1.default.searchEvents({
            city: 'Portland',
            keyword: 'Portland Trail Blazers',
            classificationName: 'Sports'
        });
        res.json({
            success: true,
            service: 'ticketmaster',
            team: 'Portland Trail Blazers',
            events: blazersEvents,
            metadata: {
                count: blazersEvents.length,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error('Blazers events error:', error);
        res.status(500).json({
            success: false,
            service: 'ticketmaster',
            error: 'Failed to fetch Blazers events'
        });
    }
});
// Error handling
app.use((error, req, res, next) => {
    logger_1.default.error('Ticketmaster service error:', error);
    res.status(500).json({
        success: false,
        service: 'ticketmaster',
        error: 'Internal Ticketmaster service error'
    });
});
// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
    logger_1.default.info(`🎫 Ticketmaster API Service running on port ${PORT}`);
    logger_1.default.info(`🔑 API Key: ${process.env.TICKETMASTER_KEY ? 'CONFIGURED' : 'MISSING'}`);
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
    logger_1.default.info('SIGTERM received, shutting down Ticketmaster service');
    server.close(async () => {
        await connection_1.default.disconnect();
        process.exit(0);
    });
});
exports.default = app;
