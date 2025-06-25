"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketmasterService = void 0;
const axios_1 = __importDefault(require("axios"));
class TicketmasterService {
    constructor() {
        this.baseUrl = 'https://app.ticketmaster.com/discovery/v2';
        this.apiKey = process.env.TICKETMASTER_KEY || '';
        console.log('🔍 Debug - TICKETMASTER_KEY exists:', !!process.env.TICKETMASTER_KEY);
        console.log('🔍 Debug - TICKETMASTER_KEY length:', process.env.TICKETMASTER_KEY?.length || 0);
        if (!this.apiKey) {
            console.warn('Ticketmaster API key not found in environment variables');
        }
        else {
            console.log('✅ Ticketmaster API key loaded successfully');
        }
    }
    async searchEvents(params = {}) {
        if (!this.apiKey) {
            console.warn('⚠️ Ticketmaster API key missing - returning empty results for MVP');
            return [];
        }
        try {
            const queryParams = new URLSearchParams({
                apikey: this.apiKey,
                city: params.city || 'Portland',
                countryCode: 'US',
                size: params.size || '50',
                sort: params.sort || 'date,asc'
            });
            if (params.classificationName) {
                queryParams.append('classificationName', params.classificationName);
            }
            if (params.minPrice) {
                queryParams.append('priceMin', params.minPrice);
            }
            if (params.maxPrice) {
                queryParams.append('priceMax', params.maxPrice);
            }
            // Add keywords for better filtering
            if (params.keyword) {
                queryParams.append('keyword', params.keyword);
            }
            if (params.startDateTime) {
                queryParams.append('startDateTime', params.startDateTime);
            }
            if (params.endDateTime) {
                queryParams.append('endDateTime', params.endDateTime);
            }
            const url = `${this.baseUrl}/events.json?${queryParams.toString()}`;
            console.log('Fetching from Ticketmaster API:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));
            const response = await axios_1.default.get(url, {
                timeout: 15000,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'RipCityTicketDispatch/1.0',
                    'X-RateLimit-Respect': 'true'
                }
            });
            const events = response.data._embedded?.events || [];
            console.log(`Successfully fetched ${events.length} events from Ticketmaster`);
            return events;
        }
        catch (error) {
            console.error('Error fetching events from Ticketmaster:', error);
            throw new Error(`Failed to fetch events from Ticketmaster: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getBlazersEvents() {
        return this.searchEvents({
            city: 'Portland',
            classificationName: 'Basketball',
            keyword: 'Trail Blazers'
        });
    }
    async getPortlandEvents() {
        return this.searchEvents({
            city: 'Portland'
        });
    }
    async getEventById(eventId) {
        if (!this.apiKey) {
            console.warn('⚠️ Ticketmaster API key missing - returning null for MVP');
            return null;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/events/${eventId}.json?apikey=${this.apiKey}`, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'RipCityTicketDispatch/1.0'
                }
            });
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching event ${eventId}:`, error);
            throw new Error(`Failed to fetch event ${eventId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getVenues(city = 'Portland') {
        if (!this.apiKey) {
            console.warn('⚠️ Ticketmaster API key missing - returning empty venues for MVP');
            return [];
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/venues.json?apikey=${this.apiKey}&city=${city}&countryCode=US&size=50`, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'RipCityTicketDispatch/1.0'
                }
            });
            return response.data._embedded?.venues || [];
        }
        catch (error) {
            console.error('Error fetching venues:', error);
            throw new Error(`Failed to fetch venues: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.TicketmasterService = TicketmasterService;
const ticketmasterService = new TicketmasterService();
exports.default = ticketmasterService;
