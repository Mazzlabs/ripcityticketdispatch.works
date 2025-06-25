"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticketmaster_1 = __importDefault(require("../services/ticketmaster"));
const eventAggregation_1 = __importDefault(require("../services/eventAggregation"));
const dealScoring_1 = require("../services/dealScoring");
const router = (0, express_1.Router)();
const dealScoringService = new dealScoring_1.DealScoringService();
/**
 * GET /api/deals
 * Get ticket deals from Ticketmaster
 */
router.get('/', async (req, res) => {
    try {
        const { category, maxPrice, minPrice, minSavings = '15', venue, sortBy = 'score', limit = '20', sources = 'ticketmaster,eventbrite' } = req.query;
        console.log('Fetching deals with params:', { category, maxPrice, minPrice, venue, sortBy, limit, sources });
        // Parse sources
        const sourcesArray = sources.split(',').map(s => s.trim());
        // Use aggregation service to search across all sources
        const events = await eventAggregation_1.default.searchAllEvents({
            category: category,
            maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
            minPrice: minPrice ? parseInt(minPrice) : undefined,
            venue: venue,
            sources: sourcesArray
        });
        if (!events || events.length === 0) {
            return res.status(200).json({
                deals: [],
                total: 0,
                message: 'No events found for the specified criteria'
            });
        }
        // Convert to response format
        let deals = events.map((event) => ({
            id: event.id,
            name: event.name,
            venue: event.venue,
            city: event.city,
            date: event.date,
            time: event.time,
            url: event.url,
            image: event.image,
            minPrice: event.minPrice,
            maxPrice: event.maxPrice,
            currency: event.currency,
            dealScore: event.dealScore || 50,
            category: event.category,
            source: event.source,
            savings: event.savings ? `$${event.savings}` : '$0',
            originalPrice: event.originalPrice || event.maxPrice,
            isFree: event.isFree || false,
            description: event.description
        }));
        // Apply additional filters
        if (venue) {
            deals = deals.filter(deal => deal.venue.toLowerCase().includes(venue.toLowerCase()));
        }
        // Sort results
        if (sortBy === 'price') {
            deals.sort((a, b) => a.minPrice - b.minPrice);
        }
        else if (sortBy === 'score') {
            deals.sort((a, b) => b.dealScore - a.dealScore);
        }
        else if (sortBy === 'date') {
            deals.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
        else if (sortBy === 'savings') {
            deals.sort((a, b) => (b.originalPrice - b.minPrice) - (a.originalPrice - a.minPrice));
        }
        // Limit results
        const limitNum = parseInt(limit);
        const limitedDeals = deals.slice(0, limitNum);
        res.status(200).json({
            deals: limitedDeals,
            total: deals.length,
            fetched: limitedDeals.length,
            lastUpdated: new Date().toISOString(),
            sources: sourcesArray,
            filters: {
                category,
                maxPrice,
                minPrice,
                minSavings,
                venue,
                sortBy
            }
        });
    }
    catch (error) {
        console.error('Error fetching deals:', error);
        res.status(500).json({
            error: 'Failed to fetch deals',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/deals/blazers
 * Get Portland Trail Blazers ticket deals
 */
router.get('/blazers', async (req, res) => {
    try {
        const events = await ticketmaster_1.default.getBlazersEvents();
        const deals = events.map((event) => ({
            id: event.id,
            name: event.name,
            venue: event._embedded?.venues?.[0]?.name || 'Moda Center',
            date: event.dates?.start?.localDate || 'TBD',
            time: event.dates?.start?.localTime || '',
            url: event.url,
            image: event.images?.[0]?.url || '',
            minPrice: event.priceRanges?.[0]?.min || 0,
            maxPrice: event.priceRanges?.[0]?.max || 0,
            currency: event.priceRanges?.[0]?.currency || 'USD'
        }));
        res.json({
            deals,
            total: deals.length,
            category: 'blazers',
            lastUpdated: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error fetching Blazers deals:', error);
        res.status(500).json({
            error: 'Failed to fetch Blazers deals',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/deals/hot
 * Get the hottest deals (highest deal scores) across all sources
 */
router.get('/hot', async (req, res) => {
    try {
        const hotDeals = await eventAggregation_1.default.getHotDeals(10);
        res.json({
            deals: hotDeals,
            total: hotDeals.length,
            category: 'hot',
            lastUpdated: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error fetching hot deals:', error);
        res.status(500).json({
            error: 'Failed to fetch hot deals',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/deals/free
 * Get free events across all sources
 */
router.get('/free', async (req, res) => {
    try {
        const { limit = '20' } = req.query;
        const freeEvents = await eventAggregation_1.default.getFreeEvents(parseInt(limit));
        res.json({
            deals: freeEvents,
            total: freeEvents.length,
            category: 'free',
            lastUpdated: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error fetching free events:', error);
        res.status(500).json({
            error: 'Failed to fetch free events',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/deals/search
 * Search events by name across all sources
 */
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({
                error: 'Query parameter "q" is required'
            });
        }
        const searchResults = await eventAggregation_1.default.searchByName(q);
        res.json({
            deals: searchResults,
            total: searchResults.length,
            query: q,
            lastUpdated: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error searching events:', error);
        res.status(500).json({
            error: 'Failed to search events',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
