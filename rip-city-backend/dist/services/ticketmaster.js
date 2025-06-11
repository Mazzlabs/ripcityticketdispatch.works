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
    }
    /**
     * Search for events in Portland area
     */
    async searchPortlandEvents(params) {
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