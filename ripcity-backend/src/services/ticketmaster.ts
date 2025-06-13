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
    this.apiKey = process.env.TICKETMASTER_KEY || '';
    if (!this.apiKey) {
      console.warn('Ticketmaster API key not found in environment variables');
    }
  }

  async searchEvents(params: EventSearchParams = {}): Promise<TicketmasterEvent[]> {
    try {
      if (!this.apiKey) {
        console.warn('No Ticketmaster API key available, returning mock data');
        return this.getMockEvents();
      }

      const queryParams = new URLSearchParams({
        apikey: this.apiKey,
        city: params.city || 'Portland',
        countryCode: 'US',
        size: '20'
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

      const url = `${this.baseUrl}/events.json?${queryParams.toString()}`;
      console.log('Fetching from Ticketmaster API:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));

      const response = await axios.get<TicketmasterResponse>(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RipCityTicketDispatch/1.0'
        }
      });

      return response.data._embedded?.events || [];
    } catch (error) {
      console.error('Error fetching events from Ticketmaster:', error);
      console.log('Falling back to mock data');
      return this.getMockEvents();
    }
  }

  private getMockEvents(): TicketmasterEvent[] {
    return [
      {
        id: 'tm-blazers-1',
        name: 'Portland Trail Blazers vs Los Angeles Lakers',
        type: 'event',
        url: 'https://www.ticketmaster.com/event/mock',
        images: [{
          url: 'https://example.com/blazers-image.jpg',
          width: 640,
          height: 360
        }],
        dates: {
          start: {
            localDate: '2025-06-15',
            localTime: '19:00:00'
          }
        },
        _embedded: {
          venues: [{
            name: 'Moda Center',
            city: { name: 'Portland' },
            state: { name: 'Oregon' }
          }]
        },
        priceRanges: [{
          type: 'standard',
          currency: 'USD',
          min: 45,
          max: 150
        }]
      },
      {
        id: 'tm-timbers-1',
        name: 'Portland Timbers vs Seattle Sounders',
        type: 'event',
        url: 'https://www.ticketmaster.com/event/mock2',
        images: [{
          url: 'https://example.com/timbers-image.jpg',
          width: 640,
          height: 360
        }],
        dates: {
          start: {
            localDate: '2025-06-20',
            localTime: '19:30:00'
          }
        },
        _embedded: {
          venues: [{
            name: 'Providence Park',
            city: { name: 'Portland' },
            state: { name: 'Oregon' }
          }]
        },
        priceRanges: [{
          type: 'standard',
          currency: 'USD',
          min: 25,
          max: 80
        }]
      },
      {
        id: 'tm-concert-1',
        name: 'Summer Concert Series',
        type: 'event',
        url: 'https://www.ticketmaster.com/event/mock3',
        images: [{
          url: 'https://example.com/concert-image.jpg',
          width: 640,
          height: 360
        }],
        dates: {
          start: {
            localDate: '2025-06-25',
            localTime: '20:00:00'
          }
        },
        _embedded: {
          venues: [{
            name: 'Crystal Ballroom',
            city: { name: 'Portland' },
            state: { name: 'Oregon' }
          }]
        },
        priceRanges: [{
          type: 'standard',
          currency: 'USD',
          min: 35,
          max: 120
        }]
      }
    ];
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
