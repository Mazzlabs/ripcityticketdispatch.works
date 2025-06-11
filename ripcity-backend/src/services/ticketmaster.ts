import axios from 'axios';

export interface EventSearchParams {
  city?: string;
  classificationName?: string;
  minPrice?: string;
  maxPrice?: string;
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
    this.apiKey = process.env.TICKETMASTER_API_KEY || 'KrJ30dNjFgddGx1vUTMB7fa5GDKU0TnT';
    if (!this.apiKey) {
      throw new Error('Ticketmaster API key is required');
    }
  }

  async searchEvents(params: EventSearchParams = {}): Promise<TicketmasterEvent[]> {
    try {
      const searchParams = new URLSearchParams({
        apikey: this.apiKey,
        size: '50',
        sort: 'date,asc',
        ...params
      });

      const response = await axios.get(`${this.baseUrl}/events.json?${searchParams}`);
      const data: TicketmasterResponse = response.data;

      return data._embedded?.events || [];
    } catch (error) {
      console.error('Error fetching events from Ticketmaster:', error);
      throw new Error('Failed to fetch events from Ticketmaster API');
    }
  }

  async getBlazersEvents(): Promise<TicketmasterEvent[]> {
    return this.searchEvents({
      city: 'Portland',
      classificationName: 'Basketball'
    });
  }

  async getPortlandEvents(): Promise<TicketmasterEvent[]> {
    return this.searchEvents({
      city: 'Portland'
    });
  }

  async getEventById(eventId: string): Promise<TicketmasterEvent | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/events/${eventId}.json?apikey=${this.apiKey}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error);
      return null;
    }
  }

  async getVenues(city: string = 'Portland'): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/venues.json?apikey=${this.apiKey}&city=${city}`);
      return response.data._embedded?.venues || [];
    } catch (error) {
      console.error('Error fetching venues:', error);
      return [];
    }
  }
}

const ticketmasterService = new TicketmasterService();
export { TicketmasterService };
export default ticketmasterService;
