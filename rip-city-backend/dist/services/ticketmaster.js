"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORTLAND_VENUE_IDS = exports.TicketmasterService = void 0;
const axios_1 = __importDefault(require("axios"));
class TicketmasterService {
    constructor(apiKey) {
        this.baseUrl = 'https://app.ticketmaster.com/discovery/v2';
        this.apiKey = apiKey;
        this.mockMode = apiKey === 'demo-key' || !apiKey;
    }
    /**
     * Generate mock data for testing/demo purposes
     */
    generateMockEvents() {
        return [
            {
                id: 'mock-blazers-1',
                name: 'Portland Trail Blazers vs Los Angeles Lakers',
                type: 'event',
                url: 'https://ticketmaster.com/mock',
                locale: 'en-us',
                images: [{
                        ratio: '16_9',
                        url: 'https://via.placeholder.com/400x225/FF0000/FFFFFF?text=Blazers+Game',
                        width: 400,
                        height: 225,
                        fallback: false
                    }],
                sales: {
                    public: {
                        startDateTime: '2025-06-01T10:00:00Z',
                        startTBD: false,
                        endDateTime: '2025-06-15T22:00:00Z'
                    }
                },
                dates: {
                    start: {
                        localDate: '2025-06-15',
                        localTime: '19:00:00',
                        dateTime: '2025-06-15T19:00:00Z',
                        dateTBD: false,
                        dateTBA: false,
                        timeTBA: false,
                        noSpecificTime: false
                    },
                    timezone: 'America/Los_Angeles',
                    status: { code: 'onsale' }
                },
                classifications: [{
                        primary: true,
                        segment: { id: 'KZFzniwnSyZfZ7v7nE', name: 'Sports' },
                        genre: { id: 'KnvZfZ7vAde', name: 'Basketball' },
                        subGenre: { id: 'KZazBEonSMnZiZgF', name: 'NBA' }
                    }],
                priceRanges: [{
                        type: 'standard',
                        currency: 'USD',
                        min: 45.00,
                        max: 250.00
                    }],
                _embedded: {
                    venues: [{
                            id: 'KovZpZAJledA',
                            name: 'Moda Center',
                            type: 'venue',
                            locale: 'en-us',
                            postalCode: '97227',
                            timezone: 'America/Los_Angeles',
                            city: { name: 'Portland' },
                            state: { name: 'Oregon', stateCode: 'OR' },
                            country: { name: 'United States Of America', countryCode: 'US' },
                            address: { line1: '1 N Center Ct St' },
                            location: { longitude: '-122.66683', latitude: '45.53161' }
                        }]
                }
            }
        ];
    }
    /**
     * Search for events in Portland area
     */
    async searchPortlandEvents(params) {
        // Return mock data if in demo mode
        if (this.mockMode) {
            console.log('Using mock data for Ticketmaster API');
            return {
                _embedded: {
                    events: this.generateMockEvents()
                },
                _links: {
                    first: { href: 'mock' },
                    self: { href: 'mock' },
                    last: { href: 'mock' }
                },
                page: {
                    size: 20,
                    totalElements: 1,
                    totalPages: 1,
                    number: 0
                }
            };
        }
        const queryParams = new URLSearchParams({
            apikey: this.apiKey,
            // Portland metro area coordinates and radius
            latlong: '45.515232,-122.678967', // Portland downtown
            radius: '50', // 50 mile radius to cover metro area
            unit: 'miles',
            locale: '*',
            ...params,
            size: (params.size || 20).toString(),
            page: (params.page || 0).toString(),
        });
        // Remove undefined values
        Object.keys(params).forEach(key => {
            if (params[key] === undefined) {
                queryParams.delete(key);
            }
        });
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/events.json`, {
                params: queryParams,
                timeout: 10000,
            });
            return response.data;
        }
        catch (error) {
            console.error('Ticketmaster API error:', error);
            throw new Error('Failed to fetch events from Ticketmaster');
        }
    }
    /**
     * Get Trail Blazers specific events
     */
    async getTrailBlazersEvents() {
        if (this.mockMode) {
            return this.generateMockEvents();
        }
        const response = await this.searchPortlandEvents({
            keyword: 'Portland Trail Blazers',
            classificationName: 'Sports',
            sort: 'date,asc',
            size: 50
        });
        return response._embedded?.events || [];
    }
    /**
     * Get Portland Timbers events
     */
    async getTimbersEvents() {
        const response = await this.searchPortlandEvents({
            keyword: 'Portland Timbers',
            classificationName: 'Sports',
            sort: 'date,asc',
            size: 50
        });
        return response._embedded?.events || [];
    }
    /**
     * Get Moda Center events
     */
    async getModaCenterEvents() {
        const response = await this.searchPortlandEvents({
            keyword: 'Moda Center',
            sort: 'date,asc',
            size: 100
        });
        return response._embedded?.events || [];
    }
    /**
     * Get events by venue ID
     */
    async getEventsByVenue(venueId) {
        const queryParams = new URLSearchParams({
            apikey: this.apiKey,
            venueId,
            sort: 'date,asc',
            size: '100'
        });
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/events.json`, {
                params: queryParams,
                timeout: 10000,
            });
            return response.data._embedded?.events || [];
        }
        catch (error) {
            console.error('Ticketmaster venue events error:', error);
            throw new Error('Failed to fetch venue events');
        }
    }
    /**
     * Get event details by ID
     */
    async getEventDetails(eventId) {
        const queryParams = new URLSearchParams({
            apikey: this.apiKey,
        });
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/events/${eventId}.json`, {
                params: queryParams,
                timeout: 10000,
            });
            return response.data;
        }
        catch (error) {
            console.error('Ticketmaster event details error:', error);
            throw new Error('Failed to fetch event details');
        }
    }
    /**
     * Search venues in Portland
     */
    async searchPortlandVenues() {
        if (this.mockMode) {
            return [{
                    id: 'KovZpZAJledA',
                    name: 'Moda Center',
                    type: 'venue',
                    city: { name: 'Portland' },
                    state: { name: 'Oregon', stateCode: 'OR' },
                    address: { line1: '1 N Center Ct St' }
                }];
        }
        const queryParams = new URLSearchParams({
            apikey: this.apiKey,
            latlong: '45.515232,-122.678967',
            radius: '50',
            unit: 'miles',
            size: '100'
        });
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/venues.json`, {
                params: queryParams,
                timeout: 10000,
            });
            return response.data._embedded?.venues || [];
        }
        catch (error) {
            console.error('Ticketmaster venues error:', error);
            throw new Error('Failed to fetch venues');
        }
    }
    /**
     * Get events with filtering options (alias for searchPortlandEvents)
     */
    async getEvents(params) {
        const response = await this.searchPortlandEvents({
            keyword: params.keyword,
            classificationName: params.classificationName,
            size: params.size,
            page: params.page,
        });
        return response._embedded?.events || [];
    }
    /**
     * Get Portland venues (alias for searchPortlandVenues)
     */
    async getPortlandVenues() {
        return this.searchPortlandVenues();
    }
}
exports.TicketmasterService = TicketmasterService;
// Portland venue IDs (we'll populate these after API registration)
exports.PORTLAND_VENUE_IDS = {
    MODA_CENTER: 'KovZpZAJledA', // Trail Blazers home
    PROVIDENCE_PARK: 'KovZpZAE6nlA', // Timbers home  
    CRYSTAL_BALLROOM: '', // TBD
    ROSELAND_THEATER: '', // TBD
    MCCAW_HALL: '', // TBD
};
//# sourceMappingURL=ticketmaster.js.map