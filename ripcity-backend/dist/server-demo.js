"use strict";
/**
 * RIP CITY TICKET DISPATCH - DEMO SERVER
 * Demo environment with mock data for presentation and testing
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
// Mock data for demo
const mockVenues = [
    {
        id: 'demo-moda-center',
        name: 'Moda Center',
        address: '1 North Center Court Street, Portland, OR 97227',
        capacity: 19980,
        type: 'arena'
    },
    {
        id: 'demo-providence-park',
        name: 'Providence Park',
        address: '1844 SW Morrison St, Portland, OR 97205',
        capacity: 25218,
        type: 'stadium'
    },
    {
        id: 'demo-crystal-ballroom',
        name: 'Crystal Ballroom',
        address: '1332 W Burnside St, Portland, OR 97209',
        capacity: 1500,
        type: 'concert-hall'
    }
];
const mockEvents = [
    {
        id: 'demo-blazers-vs-lakers',
        name: 'Portland Trail Blazers vs Los Angeles Lakers',
        venue: 'Moda Center',
        date: '2024-12-15T19:00:00Z',
        category: 'sports',
        price_range: { min: 25, max: 500 },
        availability: 'available',
        image: 'https://via.placeholder.com/400x300/FF0000/FFFFFF?text=Blazers+vs+Lakers',
        deal_score: 85
    },
    {
        id: 'demo-timbers-playoff',
        name: 'Portland Timbers - MLS Cup Playoff',
        venue: 'Providence Park',
        date: '2024-12-20T14:00:00Z',
        category: 'sports',
        price_range: { min: 35, max: 200 },
        availability: 'limited',
        image: 'https://via.placeholder.com/400x300/006341/FFFFFF?text=Timbers+Playoff',
        deal_score: 92
    },
    {
        id: 'demo-concert-indie',
        name: 'Indie Rock Festival 2024',
        venue: 'Crystal Ballroom',
        date: '2024-12-18T20:00:00Z',
        category: 'music',
        price_range: { min: 45, max: 120 },
        availability: 'available',
        image: 'https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Indie+Festival',
        deal_score: 78
    },
    {
        id: 'demo-comedy-show',
        name: 'Portland Comedy Night',
        venue: 'Crystal Ballroom',
        date: '2024-12-22T19:30:00Z',
        category: 'entertainment',
        price_range: { min: 20, max: 75 },
        availability: 'available',
        image: 'https://via.placeholder.com/400x300/FF6B35/FFFFFF?text=Comedy+Night',
        deal_score: 70
    },
    {
        id: 'demo-free-festival',
        name: 'Winter Wonderland Festival',
        venue: 'Tom McCall Waterfront Park',
        date: '2024-12-23T15:00:00Z',
        category: 'entertainment',
        price_range: { min: 0, max: 0 },
        availability: 'available',
        image: 'https://via.placeholder.com/400x300/0066CC/FFFFFF?text=Free+Festival',
        deal_score: 95,
        is_free: true
    }
];
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8081', 10);
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "https://www.googletagmanager.com"],
            imgSrc: ["'self'", "data:", "https:", "https://via.placeholder.com"],
            connectSrc: ["'self'"]
        }
    }
}));
// CORS configuration
const corsOptions = {
    origin: [
        'https://ripcityticketdispatch.works',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
// Rate limiting (relaxed for demo)
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // High limit for demo
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// Body parsing middleware
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check for demo
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            database: 'demo_mode',
            ticketmaster: 'demo_data',
            eventbrite: 'demo_data',
            stripe: 'demo_mode',
            twilio: 'demo_mode',
            sendgrid: 'demo_mode'
        },
        environment: 'demo',
        api_keys: {
            demo_mode: true
        }
    });
});
// Demo venues endpoint
app.get('/api/venues', (req, res) => {
    logger_1.default.info('Demo: Serving mock venues data');
    res.json({
        success: true,
        venues: mockVenues,
        source: 'demo_data',
        metadata: {
            count: mockVenues.length,
            timestamp: new Date().toISOString(),
            api_key_status: 'demo_mode'
        }
    });
});
// Demo events endpoint
app.get('/api/events', (req, res) => {
    const { category, limit = '50' } = req.query;
    logger_1.default.info('Demo: Serving mock events data', { category, limit });
    let filteredEvents = mockEvents;
    if (category && category !== 'all') {
        filteredEvents = mockEvents.filter(event => event.category === category);
    }
    const limitedEvents = filteredEvents.slice(0, parseInt(limit || '50'));
    res.json({
        success: true,
        events: limitedEvents,
        sources: ['demo_data'],
        metadata: {
            total: limitedEvents.length,
            timestamp: new Date().toISOString(),
            api_status: 'demo_mode',
            category_filter: category || 'all'
        }
    });
});
// Demo Blazers endpoint
app.get('/api/blazers', (req, res) => {
    logger_1.default.info('Demo: Serving mock Blazers events');
    const blazersEvents = mockEvents.filter(event => event.name.includes('Blazers'));
    res.json({
        success: true,
        events: blazersEvents,
        source: 'demo_data',
        metadata: {
            count: blazersEvents.length,
            timestamp: new Date().toISOString(),
            team: 'Portland Trail Blazers'
        }
    });
});
// Demo hot deals
app.get('/api/deals/hot', (req, res) => {
    logger_1.default.info('Demo: Serving mock hot deals');
    const hotDeals = mockEvents
        .filter(event => event.deal_score >= 80)
        .sort((a, b) => b.deal_score - a.deal_score);
    res.json({
        success: true,
        deals: hotDeals,
        source: 'demo_data',
        metadata: {
            count: hotDeals.length,
            timestamp: new Date().toISOString(),
            scoring: 'demo_algorithm'
        }
    });
});
// Demo free events
app.get('/api/deals/free', (req, res) => {
    logger_1.default.info('Demo: Serving mock free events');
    const freeEvents = mockEvents.filter(event => event.is_free || event.price_range.min === 0);
    res.json({
        success: true,
        deals: freeEvents,
        source: 'demo_data',
        metadata: {
            count: freeEvents.length,
            timestamp: new Date().toISOString(),
            price_filter: 'free_only'
        }
    });
});
// Demo search
app.get('/api/deals/search', (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({
            success: false,
            error: 'Query parameter "q" is required'
        });
    }
    logger_1.default.info('Demo: Searching mock events', { query: q });
    const searchResults = mockEvents.filter(event => event.name.toLowerCase().includes(q.toLowerCase()) ||
        event.venue.toLowerCase().includes(q.toLowerCase()) ||
        event.category.toLowerCase().includes(q.toLowerCase()));
    res.json({
        success: true,
        deals: searchResults,
        query: q,
        source: 'demo_search',
        metadata: {
            count: searchResults.length,
            timestamp: new Date().toISOString()
        }
    });
});
// Serve legal documents
app.use('/legal', express_1.default.static(path_1.default.join(__dirname, '../legal-site')));
// Demo server info
app.get('/', (req, res) => {
    res.json({
        name: 'Rip City Ticket Dispatch API - DEMO MODE',
        version: '1.0.0-demo',
        status: 'active',
        description: 'Portland Event Ticket Aggregation API - Demo Environment',
        mode: 'DEMO',
        data: 'Mock data for demonstration purposes',
        endpoints: {
            health: '/health',
            api: '/api/*',
            legal: '/legal/*'
        },
        demo_features: [
            'Mock venue data',
            'Mock event data',
            'Demo scoring algorithm',
            'No live API calls',
            'Safe for testing'
        ],
        timestamp: new Date().toISOString()
    });
});
// 404 handler for unknown routes
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'API endpoint not found',
            available_endpoints: [
                '/api/venues',
                '/api/events',
                '/api/blazers',
                '/api/deals/hot',
                '/api/deals/free',
                '/api/deals/search'
            ],
            mode: 'demo'
        });
    }
    if (req.path.startsWith('/legal/')) {
        return res.sendFile(path_1.default.join(__dirname, '../legal-site/index.html'));
    }
    res.status(404).json({
        error: 'Not Found',
        message: 'This is a demo API server.',
        mode: 'demo',
        api_documentation: '/api/docs'
    });
});
// Error handling middleware
app.use((error, req, res, next) => {
    logger_1.default.error('Demo server error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        mode: 'demo'
    });
});
// Start demo server
const server = app.listen(PORT, '0.0.0.0', () => {
    logger_1.default.info(`🎭 Rip City DEMO Server running on port ${PORT}`);
    logger_1.default.info(`🏀 Environment: DEMO MODE`);
    logger_1.default.info(`🎪 Data: Mock data for demonstration`);
    logger_1.default.info(`🔒 APIs: No live API calls made`);
    logger_1.default.info(`✅ Status: Safe for testing and demos`);
    logger_1.default.info(`🌐 Access: http://localhost:${PORT}`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received, shutting down demo server gracefully');
    server.close(() => {
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT received, shutting down demo server gracefully');
    server.close(() => {
        process.exit(0);
    });
});
exports.default = app;
