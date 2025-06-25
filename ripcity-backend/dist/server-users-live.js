"use strict";
/**
 * RIP CITY TICKET DISPATCH - User Management Server
 * Dedicated server for user authentication and profile management
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
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = require("./middleware/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8084', 10);
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
// Rate limiting - stricter for auth endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit auth attempts
    message: 'Too many authentication attempts'
});
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Too many requests'
});
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/users/forgot-password', authLimiter);
app.use(generalLimiter);
app.use(express_1.default.json({ limit: '10mb' }));
// Health check
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await connection_1.default.healthCheck();
        const jwtConfigured = !!process.env.JWT_SECRET;
        res.json({
            service: 'user-management',
            status: 'healthy',
            database: dbHealth ? 'connected' : 'disconnected',
            jwt_configured: jwtConfigured,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            service: 'user-management',
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// User management endpoints
app.use('/api/users', users_1.default);
// Protected user profile endpoint
app.get('/api/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        res.json({
            success: true,
            service: 'user-management',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                tier: user.tier || 'free'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.default.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            service: 'user-management',
            error: 'Failed to fetch user profile'
        });
    }
});
// User preferences endpoint
app.get('/api/preferences', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        // TODO: Fetch user preferences from database
        const preferences = {
            notifications: true,
            emailAlerts: true,
            smsAlerts: false, // MVP - SMS disabled
            categories: ['NBA', 'MLS', 'Music'],
            priceThreshold: 100
        };
        res.json({
            success: true,
            service: 'user-management',
            preferences,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.default.error('Preferences fetch error:', error);
        res.status(500).json({
            success: false,
            service: 'user-management',
            error: 'Failed to fetch user preferences'
        });
    }
});
// Update preferences endpoint
app.put('/api/preferences', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const { notifications, emailAlerts, categories, priceThreshold } = req.body;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        // TODO: Update user preferences in database
        logger_1.default.info('Updating user preferences', {
            userId: user.id,
            preferences: { notifications, emailAlerts, categories, priceThreshold }
        });
        res.json({
            success: true,
            service: 'user-management',
            message: 'Preferences updated successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.default.error('Preferences update error:', error);
        res.status(500).json({
            success: false,
            service: 'user-management',
            error: 'Failed to update preferences'
        });
    }
});
// Error handling
app.use((error, req, res, next) => {
    logger_1.default.error('User management service error:', error);
    res.status(500).json({
        success: false,
        service: 'user-management',
        error: 'Internal user management service error'
    });
});
// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
    logger_1.default.info(`👤 User Management Service running on port ${PORT}`);
    logger_1.default.info(`🔐 JWT: ${process.env.JWT_SECRET ? 'CONFIGURED' : 'MISSING'}`);
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
    logger_1.default.info('SIGTERM received, shutting down User Management service');
    server.close(async () => {
        await connection_1.default.disconnect();
        process.exit(0);
    });
});
exports.default = app;
