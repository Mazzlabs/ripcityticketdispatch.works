"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticketmaster_1 = require("../services/ticketmaster");
const dealScoring_1 = require("../services/dealScoring");
const router = (0, express_1.Router)();
// Initialize services
const ticketmasterService = new ticketmaster_1.TicketmasterService(process.env.TICKETMASTER_API_KEY || '');
const dealScoringService = new dealScoring_1.DealScoringService();
/**
 * GET /api/deals
 * Search for ticket deals in Portland area
 */
router.get('/', async (req, res) => {
    try {
        const { category, maxPrice, minSavings = '15', venue, sortBy = 'score', limit = '20' } = req.query;
        console.log('Fetching deals with params:', { category, maxPrice, minSavings, venue, sortBy, limit });
        // Validate API key
        if (!process.env.TICKETMASTER_API_KEY) {
            return res.status(500).json({
                error: 'Ticketmaster API key not configured',
                message: 'Please set TICKETMASTER_API_KEY environment variable'
            });
        }
        // Fetch events from Ticketmaster
        const events = await ticketmasterService.searchPortlandEvents({
            classificationName: category === 'sports' ? 'Sports' :
                category === 'music' ? 'Music' : undefined,
            size: parseInt(limit) * 2, // Get more to filter down
            sort: 'date,asc'
        });
        if (!events._embedded?.events) {
            return res.status(200).json({
                deals: [],
                total: 0,
                message: 'No events found for the specified criteria'
            });
        }
        // Score each event as a potential deal
        const deals = events._embedded.events
            .map(event => {
            // Determine venue popularity (1-10)
            const venuePopularity = getVenuePopularity(event._embedded?.venues?.[0]?.name);
            // Determine event popularity (1-10)
            const eventPopularity = getEventPopularity(event.name, event.classifications?.[0]);
            // Calculate days until event
            const eventDate = new Date(event.dates.start.dateTime || event.dates.start.localDate);
            const timeUntilEvent = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return dealScoringService.scoreDeal(event, {
                minSavingsPercentage: parseInt(minSavings),
                maxPriceThreshold: maxPrice ? parseInt(maxPrice) : undefined,
                venuePopularity,
                eventPopularity,
                timeUntilEvent: Math.max(timeUntilEvent, 0)
            });
        })
            .filter((deal) => deal !== null);
        // Apply filters
        const filteredDeals = dealScoringService.filterDeals(deals, {
            categories: category ? [category] : undefined,
            maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
            minSavings: parseInt(minSavings),
            venues: venue ? [venue] : undefined
        });
        // Sort and limit results
        const sortedDeals = dealScoringService.sortDeals(filteredDeals, sortBy)
            .slice(0, parseInt(limit));
        res.status(200).json({
            deals: sortedDeals,
            total: filteredDeals.length,
            fetched: sortedDeals.length,
            lastUpdated: new Date().toISOString(),
            filters: {
                category,
                maxPrice,
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
 * GET /api/deals/hot
 * Get the hottest deals (score >= 80)
 */
router.get('/hot', async (req, res) => {
    try {
        // Reuse the main deals logic but filter for hot deals only
        req.query.minSavings = '20'; // Higher threshold for hot deals
        // Call the main deals endpoint logic
        // ... (similar logic but with hot deal filters)
        res.json({ message: 'Hot deals endpoint - coming soon!' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch hot deals' });
    }
});
function getVenuePopularity(venueName) {
    if (!venueName)
        return 5;
    const name = venueName.toLowerCase();
    // Portland venue popularity scoring
    if (name.includes('moda center'))
        return 10; // Trail Blazers home
    if (name.includes('providence park'))
        return 9; // Timbers home
    if (name.includes('crystal ballroom'))
        return 8;
    if (name.includes('roseland theater'))
        return 7;
    if (name.includes('doug fir'))
        return 6;
    if (name.includes('revolution hall'))
        return 7;
    if (name.includes('veterans memorial'))
        return 8;
    return 5; // Default for unknown venues
}
function getEventPopularity(eventName, classification) {
    const name = eventName.toLowerCase();
    // Trail Blazers games are always popular in Portland
    if (name.includes('trail blazers') || name.includes('blazers')) {
        if (name.includes('playoff') || name.includes('lakers') || name.includes('warriors')) {
            return 10;
        }
        return 9;
    }
    // Timbers games
    if (name.includes('timbers')) {
        if (name.includes('playoff') || name.includes('seattle') || name.includes('sounders')) {
            return 10;
        }
        return 8;
    }
    // Major touring acts
    if (name.includes('taylor swift') || name.includes('beyonce') || name.includes('drake')) {
        return 10;
    }
    // Other sports
    if (classification?.segment?.name?.toLowerCase().includes('sport')) {
        return 7;
    }
    // Music events
    if (classification?.segment?.name?.toLowerCase().includes('music')) {
        return 6;
    }
    return 5; // Default
}
exports.default = router;
//# sourceMappingURL=deals.js.map