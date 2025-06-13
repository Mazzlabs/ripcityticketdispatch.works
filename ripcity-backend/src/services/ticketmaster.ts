import axios from 'axios';

export interface EventSearchParams {
  city?: string;
  classificationName?: string;
  minPrice?: string;
  maxPrice?: string;
  keyword?: string;
  startDateTime?: string;
  endDateTime?: string;
  size?: string;
  sort?: string;
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  type: string;
  url: string;
  locale?: string;
  images?: Array<{
    ratio?: string;
    url: string;
    width: number;
    height: number;
    fallback?: boolean;
  }>;
  sales?: {
    public?: {
      startDateTime?: string;
      startTBD?: boolean;
      endDateTime?: string;
    };
  };
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      city?: { name: string };
      state?: { name: string };
    }>;
  };
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
}

export interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

class TicketmasterService {
  private apiKey: string;
  private baseUrl = 'https://app.ticketmaster.com/discovery/v2';

  constructor() {
    this.apiKey = process.env.TICKETMASTER_KEY || '';
    if (!this.apiKey) {
      console.warn('Ticketmaster API key not found in environment variables');
    }
  }

  async searchEvents(params: EventSearchParams = {}): Promise<TicketmasterEvent[]> {
    if (!this.apiKey) {
      throw new Error('Ticketmaster API key is required for production use. Please set TICKETMASTER_KEY environment variable.');
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

      const response = await axios.get<TicketmasterResponse>(url, {
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
    } catch (error) {
      console.error('Error fetching events from Ticketmaster:', error);
      throw new Error(`Failed to fetch events from Ticketmaster: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBlazersEvents(): Promise<TicketmasterEvent[]> {
    return this.searchEvents({
      city: 'Portland',
      classificationName: 'Basketball',
      keyword: 'Trail Blazers'
    });
  }

  async getPortlandEvents(): Promise<TicketmasterEvent[]> {
    return this.searchEvents({
      city: 'Portland'
    });
  }

  async getEventById(eventId: string): Promise<TicketmasterEvent | null> {
    if (!this.apiKey) {
      throw new Error('Ticketmaster API key is required for production use. Please set TICKETMASTER_KEY environment variable.');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/events/${eventId}.json?apikey=${this.apiKey}`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RipCityTicketDispatch/1.0'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error);
      throw new Error(`Failed to fetch event ${eventId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getVenues(city: string = 'Portland'): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('Ticketmaster API key is required for production use. Please set TICKETMASTER_KEY environment variable.');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/venues.json?apikey=${this.apiKey}&city=${city}&countryCode=US&size=50`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RipCityTicketDispatch/1.0'
        }
      });
      return response.data._embedded?.venues || [];
    } catch (error) {
      console.error('Error fetching venues:', error);
      throw new Error(`Failed to fetch venues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

const ticketmasterService = new TicketmasterService();
export { TicketmasterService };
export default ticketmasterService;
