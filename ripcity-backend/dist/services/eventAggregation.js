"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ticketmaster_1 = __importDefault(require("./ticketmaster"));
const eventbrite_1 = __importDefault(require("./eventbrite"));
const dealScoring_1 = require("./dealScoring");
const logger_1 = require("../utils/logger");
class EventAggregationService {
    constructor() {
        this.dealScoringService = new dealScoring_1.DealScoringService();
    }
    /**
     * Search events across all sources
     */
    async searchAllEvents(filters = {}) {
        const promises = [];
        const sources = filters.sources || ['ticketmaster', 'eventbrite'];
        // Ticketmaster search
        if (sources.includes('ticketmaster')) {
            promises.push(this.getTicketmasterEvents(filters));
        }
        // Eventbrite search
        if (sources.includes('eventbrite')) {
            promises.push(this.getEventbriteEvents(filters));
        }
        try {
            const results = await Promise.allSettled(promises);
            let allEvents = [];
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    allEvents = allEvents.concat(result.value);
                }
                else {
                    const source = sources[index];
                    logger_1.logger.error(`Failed to fetch events from ${source}:`, result.reason);
                }
            });
            // Remove duplicates and apply filters
            const uniqueEvents = this.removeDuplicates(allEvents);
            const filteredEvents = this.applyFilters(uniqueEvents, filters);
            // Score all events
            const scoredEvents = this.scoreEvents(filteredEvents);
            return scoredEvents.sort((a, b) => (b.dealScore || 0) - (a.dealScore || 0));
        }
        catch (error) {
            logger_1.logger.error('Error in searchAllEvents:', error);
            return [];
        }
    }
    /**
     * Get events from Ticketmaster
     */
    async getTicketmasterEvents(filters) {
        try {
            let classificationName;
            if (filters.category === 'sports') {
                classificationName = 'Basketball';
            }
            else if (filters.category === 'music') {
                classificationName = 'Music';
            }
            const events = await ticketmaster_1.default.searchEvents({
                city: 'Portland',
                classificationName,
                maxPrice: filters.maxPrice?.toString(),
                minPrice: filters.minPrice?.toString()
            });
            return events.map(event => {
                const venue = event._embedded?.venues?.[0];
                const priceRange = event.priceRanges?.[0];
                return {
                    id: `tm_${event.id}`,
                    name: event.name,
                    venue: venue?.name || 'Unknown Venue',
                    city: venue?.city?.name || 'Portland',
                    date: event.dates?.start?.localDate || 'TBD',
                    time: event.dates?.start?.localTime || '',
                    url: event.url,
                    image: event.images?.[0]?.url || '',
                    minPrice: priceRange?.min || 0,
                    maxPrice: priceRange?.max || 0,
                    currency: priceRange?.currency || 'USD',
                    category: this.getTicketmasterCategory(event),
                    source: 'ticketmaster',
                    isFree: (priceRange?.min || 0) === 0
                };
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching Ticketmaster events:', error);
            return [];
        }
    }
    /**
     * Get events from Eventbrite
     */
    async getEventbriteEvents(filters) {
        try {
            let events;
            if (filters.category === 'sports') {
                events = await eventbrite_1.default.getPortlandSportsEvents();
            }
            else if (filters.category === 'music') {
                events = await eventbrite_1.default.getPortlandMusicEvents();
            }
            else if (filters.category === 'entertainment') {
                events = await eventbrite_1.default.getPortlandEntertainmentEvents();
            }
            else {
                events = await eventbrite_1.default.getPortlandEvents();
            }
            return events.map(event => {
                const converted = eventbrite_1.default.convertToStandardFormat(event);
                return {
                    id: `eb_${event.id}`,
                    name: converted.name,
                    venue: converted.venue,
                    city: converted.city,
                    date: converted.date,
                    time: converted.time,
                    url: converted.url,
                    image: converted.image,
                    minPrice: converted.minPrice,
                    maxPrice: converted.maxPrice,
                    currency: converted.currency,
                    category: this.getEventbriteCategory(event),
                    source: 'eventbrite',
                    isFree: converted.isFree,
                    description: converted.description
                };
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching Eventbrite events:', error);
            return [];
        }
    }
    /**
     * Remove duplicate events based on name and date similarity
     */
    removeDuplicates(events) {
        const seen = new Set();
        return events.filter(event => {
            const key = `${event.name.toLowerCase().trim()}_${event.date}_${event.venue.toLowerCase().trim()}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    /**
     * Apply additional filters to events
     */
    applyFilters(events, filters) {
        return events.filter(event => {
            // Price filters
            if (filters.maxPrice && event.maxPrice > filters.maxPrice) {
                return false;
            }
            if (filters.minPrice && event.minPrice < filters.minPrice) {
                return false;
            }
            // Venue filter
            if (filters.venue && !event.venue.toLowerCase().includes(filters.venue.toLowerCase())) {
                return false;
            }
            // Date range filter
            if (filters.dateRange) {
                const eventDate = new Date(event.date);
                const startDate = new Date(filters.dateRange.start);
                const endDate = new Date(filters.dateRange.end);
                if (eventDate < startDate || eventDate > endDate) {
                    return false;
                }
            }
            // Free events filter
            if (filters.includeFreeEvents === false && event.isFree) {
                return false;
            }
            return true;
        });
    }
    /**
     * Score events using the deal scoring service
     */
    scoreEvents(events) {
        return events.map(event => {
            // Convert to format expected by deal scoring service
            const mockTicketmasterEvent = {
                id: event.id,
                name: event.name,
                type: 'event',
                dates: {
                    start: {
                        localDate: event.date,
                        localTime: event.time
                    }
                },
                _embedded: {
                    venues: [{
                            name: event.venue,
                            city: { name: event.city }
                        }]
                },
                priceRanges: [{
                        type: 'standard',
                        currency: event.currency,
                        min: event.minPrice,
                        max: event.maxPrice
                    }],
                images: event.image ? [{
                        url: event.image,
                        width: 640,
                        height: 360
                    }] : [],
                url: event.url,
                classifications: [{
                        segment: { name: event.category }
                    }]
            };
            const scoredDeals = this.dealScoringService.scoreDeals([mockTicketmasterEvent]);
            const scoredDeal = scoredDeals[0];
            return {
                ...event,
                dealScore: scoredDeal?.dealScore || 50,
                savings: scoredDeal?.savings || 0,
                originalPrice: scoredDeal?.originalPrice || event.maxPrice
            };
        });
    }
    /**
     * Get category from Ticketmaster event
     */
    getTicketmasterCategory(event) {
        const classification = event.classifications?.[0];
        if (classification?.segment?.name === 'Sports')
            return 'sports';
        if (classification?.segment?.name === 'Music')
            return 'music';
        if (classification?.segment?.name === 'Arts & Theatre')
            return 'entertainment';
        return 'other';
    }
    /**
     * Get category from Eventbrite event based on category_id
     */
    getEventbriteCategory(event) {
        // Eventbrite category mapping
        const categoryMap = {
            '108': 'sports', // Sports & Fitness
            '103': 'music', // Music  
            '105': 'entertainment', // Performing & Visual Arts
            '110': 'entertainment', // Travel & Outdoor
            '104': 'entertainment', // Film, Media & Entertainment
        };
        return categoryMap[event.category_id] || 'other';
    }
    /**
     * Get hot deals across all sources
     */
    async getHotDeals(limit = 10) {
        const allEvents = await this.searchAllEvents();
        return allEvents
            .filter(event => (event.dealScore || 0) > 70)
            .slice(0, limit);
    }
    /**
     * Get free events across all sources
     */
    async getFreeEvents(limit = 20) {
        const allEvents = await this.searchAllEvents({
            includeFreeEvents: true
        });
        return allEvents
            .filter(event => event.isFree)
            .slice(0, limit);
    }
    /**
     * Search events by name across all sources
     */
    async searchByName(query) {
        const allEvents = await this.searchAllEvents();
        return allEvents.filter(event => event.name.toLowerCase().includes(query.toLowerCase()) ||
            event.venue.toLowerCase().includes(query.toLowerCase()) ||
            (event.description && event.description.toLowerCase().includes(query.toLowerCase())));
    }
}
exports.default = new EventAggregationService();
