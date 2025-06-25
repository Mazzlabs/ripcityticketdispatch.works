"use strict";
/**
 * RIP CITY TICKET DISPATCH - Live Eventbrite API Server
 * Dedicated server for Eventbrite API integration
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
const eventbrite_1 = __importDefault(require("./services/eventbrite"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8082', 10);
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
    max: 150, // Eventbrite has stricter limits
    message: 'Too many Eventbrite API requests'
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
// Health check
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await connection_1.default.healthCheck();
        const apiStatus = !!process.env.EVENTBRITE_KEY;
        res.json({
            service: 'eventbrite-api',
            status: 'healthy',
            database: dbHealth ? 'connected' : 'disconnected',
            eventbrite_api: apiStatus ? 'configured' : 'missing_key',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            service: 'eventbrite-api',
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Eventbrite-specific endpoints
app.get('/api/eventbrite/events', async (req, res) => {
    try {
        const { location = 'Portland', category, price_filter } = req.query;
        logger_1.default.info('Fetching Eventbrite events', { location, category, price_filter });
        const events = await eventbrite_1.default.getPortlandEvents();
        res.json({
            success: true,
            service: 'eventbrite',
            events,
            metadata: {
                count: events.length,
                location,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error('Eventbrite events error:', error);
        res.status(500).json({
            success: false,
            service: 'eventbrite',
            error: 'Failed to fetch events from Eventbrite API'
        });
    }
});
app.get('/api/eventbrite/music', async (req, res) => {
    try {
        logger_1.default.info('Fetching Eventbrite music events');
        const musicEvents = await eventbrite_1.default.getPortlandMusicEvents();
        res.json({
            success: true,
            service: 'eventbrite',
            category: 'music',
            events: musicEvents,
            metadata: {
                count: musicEvents.length,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error('Eventbrite music events error:', error);
        res.status(500).json({
            success: false,
            service: 'eventbrite',
            error: 'Failed to fetch music events'
        });
    }
});
app.get('/api/eventbrite/entertainment', async (req, res) => {
    try {
        logger_1.default.info('Fetching Eventbrite entertainment events');
        const entertainmentEvents = await eventbrite_1.default.getPortlandEntertainmentEvents();
        res.json({
            success: true,
            service: 'eventbrite',
            category: 'entertainment',
            events: entertainmentEvents,
            metadata: {
                count: entertainmentEvents.length,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error('Eventbrite entertainment events error:', error);
        res.status(500).json({
            success: false,
            service: 'eventbrite',
            error: 'Failed to fetch entertainment events'
        });
    }
});
app.get('/api/eventbrite/free', async (req, res) => {
    try {
        logger_1.default.info('Fetching free Eventbrite events');
        const freeEvents = await eventbrite_1.default.getFreeEvents();
        res.json({
            success: true,
            service: 'eventbrite',
            category: 'free',
            events: freeEvents,
            metadata: {
                count: freeEvents.length,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error('Eventbrite free events error:', error);
        res.status(500).json({
            success: false,
            service: 'eventbrite',
            error: 'Failed to fetch free events'
        });
    }
});
// Error handling
app.use((error, req, res, next) => {
    logger_1.default.error('Eventbrite service error:', error);
    res.status(500).json({
        success: false,
        service: 'eventbrite',
        error: 'Internal Eventbrite service error'
    });
});
// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
    logger_1.default.info(`🎪 Eventbrite API Service running on port ${PORT}`);
    logger_1.default.info(`🔑 API Key: ${process.env.EVENTBRITE_KEY ? 'CONFIGURED' : 'MISSING'}`);
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
    logger_1.default.info('SIGTERM received, shutting down Eventbrite service');
    server.close(async () => {
        await connection_1.default.disconnect();
        process.exit(0);
    });
});
exports.default = app;
