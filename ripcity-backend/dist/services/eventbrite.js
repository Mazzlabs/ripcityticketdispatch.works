"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class EventbriteService {
    constructor() {
        this.baseUrl = 'https://www.eventbriteapi.com/v3';
        this.apiKey = process.env.EVENTBRITE_KEY || '';
        this.apiSecret = process.env.EVENTBRITE_SECRET || '';
        console.log('🔍 Debug - EVENTBRITE_KEY exists:', !!process.env.EVENTBRITE_KEY);
        console.log('🔍 Debug - EVENTBRITE_KEY length:', process.env.EVENTBRITE_KEY?.length || 0);
        if (!this.apiKey) {
            logger_1.logger.warn('Eventbrite API key not found');
        }
        else {
            console.log('✅ Eventbrite API key loaded successfully');
        }
    }
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }
    /**
     * Search for events in Portland area
     */
    async searchEvents(params = {}) {
        if (!this.apiKey) {
            console.warn('⚠️ Eventbrite API key missing - returning empty results for MVP');
            return [];
        }
        try {
            const searchParams = new URLSearchParams({
                'location.address': params.location || 'Portland, OR',
                'location.within': params.location_within || '25mi',
                'start_date.range_start': params.start_date_range_start || new Date().toISOString(),
                'start_date.range_end': params.start_date_range_end || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
                'sort_by': params.sort_by || 'date',
                'page': (params.page || 1).toString(),
                'expand': params.expand || 'venue,ticket_classes,organizer'
            });
            // Add optional parameters
            if (params.categories)
                searchParams.append('categories', params.categories);
            if (params.price)
                searchParams.append('price', params.price);
            if (params.name_filter)
                searchParams.append('q', params.name_filter);
            logger_1.logger.info('Fetching events from Eventbrite API', {
                location: params.location || 'Portland, OR',
                categories: params.categories,
                price: params.price
            });
            const response = await axios_1.default.get(`${this.baseUrl}/events/search/?${searchParams}`, {
                headers: this.getHeaders(),
                timeout: 15000
            });
            const events = response.data.events || [];
            logger_1.logger.info(`Successfully fetched ${events.length} events from Eventbrite`);
            return events;
        }
        catch (error) {
            logger_1.logger.error('Error searching Eventbrite events:', error);
            throw new Error(`Failed to search Eventbrite events: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get Portland sports events
     */
    async getPortlandSportsEvents() {
        return this.searchEvents({
            location: 'Portland, OR',
            categories: '108', // Sports & Fitness category ID
            location_within: '25mi'
        });
    }
    /**
     * Get Portland music events
     */
    async getPortlandMusicEvents() {
        return this.searchEvents({
            location: 'Portland, OR',
            categories: '103', // Music category ID
            location_within: '25mi'
        });
    }
    /**
     * Get Portland entertainment events
     */
    async getPortlandEntertainmentEvents() {
        return this.searchEvents({
            location: 'Portland, OR',
            categories: '105', // Performing & Visual Arts category ID
            location_within: '25mi'
        });
    }
    /**
     * Get all Portland events
     */
    async getPortlandEvents() {
        return this.searchEvents({
            location: 'Portland, OR',
            location_within: '25mi'
        });
    }
    /**
     * Get free events in Portland
     */
    async getFreeEvents() {
        return this.searchEvents({
            location: 'Portland, OR',
            price: 'free',
            location_within: '25mi'
        });
    }
    /**
     * Get event details by ID
     */
    async getEventDetails(eventId) {
        try {
            if (!this.apiKey) {
                logger_1.logger.warn('Eventbrite API key not available');
                return null;
            }
            const response = await axios_1.default.get(`${this.baseUrl}/events/${eventId}/?expand=venue,ticket_classes,organizer`, {
                headers: this.getHeaders(),
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching Eventbrite event ${eventId}:`, error);
            return null;
        }
    }
    /**
     * Convert Eventbrite event to standardized format
     */
    convertToStandardFormat(event) {
        const minPrice = event.ticket_classes && event.ticket_classes.length > 0
            ? Math.min(...event.ticket_classes.map(tc => tc.cost.value / 100)) // Convert from cents
            : 0;
        const maxPrice = event.ticket_classes && event.ticket_classes.length > 0
            ? Math.max(...event.ticket_classes.map(tc => tc.cost.value / 100)) // Convert from cents
            : 0;
        return {
            id: event.id,
            name: event.name.text,
            venue: event.venue?.name || 'Online Event',
            city: event.venue?.address?.city || 'Portland',
            date: event.start.local.split('T')[0],
            time: event.start.local.split('T')[1]?.substring(0, 5) || '',
            url: event.url,
            image: event.logo?.original?.url || '',
            minPrice: minPrice,
            maxPrice: maxPrice || minPrice,
            currency: event.currency || 'USD',
            isFree: event.is_free,
            category: 'eventbrite',
            source: 'eventbrite',
            description: event.description?.text || event.summary || '',
            organizer: event.organizer_id,
            capacity: event.capacity,
            attendeeCount: event.ticket_classes?.reduce((sum, tc) => sum + tc.quantity_sold, 0) || 0
        };
    }
}
exports.default = new EventbriteService();
