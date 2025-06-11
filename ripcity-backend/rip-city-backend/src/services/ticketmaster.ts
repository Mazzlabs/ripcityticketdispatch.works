<<<<<<< HEAD
export interface EventSearchParams {
  city?: string;
  classificationName?: string;
  minPrice?: string;
  maxPrice?: string;
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  url?: string;
  images?: Array<{ url: string; width: number; height: number }>;
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
=======
import axios from 'axios';

// Ticketmaster API Types
export interface TicketmasterEvent {
  id: string;
  name: string;
  type: string;
  url: string;
  locale: string;
  images: Array<{
    ratio: string;
    url: string;
    width: number;
    height: number;
    fallback: boolean;
  }>;
  sales: {
    public: {
      startDateTime: string;
      startTBD: boolean;
      endDateTime: string;
    };
  };
  dates: {
    start: {
      localDate: string;
      localTime: string;
      dateTime: string;
      dateTBD: boolean;
      dateTBA: boolean;
      timeTBA: boolean;
      noSpecificTime: boolean;
    };
    timezone: string;
    status: {
      code: string;
    };
  };
  classifications: Array<{
    primary: boolean;
    segment: {
      id: string;
      name: string;
    };
    genre: {
      id: string;
      name: string;
    };
    subGenre: {
      id: string;
      name: string;
    };
  }>;
>>>>>>> 1cab5437522ec66ec90fcb67dd3e3a14510935b2
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
<<<<<<< HEAD
=======
  _embedded?: {
    venues: Array<{
      id: string;
      name: string;
      type: string;
      locale: string;
      postalCode: string;
      timezone: string;
      city: {
        name: string;
      };
      state: {
        name: string;
        stateCode: string;
      };
      country: {
        name: string;
        countryCode: string;
      };
      address: {
        line1: string;
      };
      location: {
        longitude: string;
        latitude: string;
      };
    }>;
  };
}

export interface TicketmasterResponse {
  _embedded?: {
    events: TicketmasterEvent[];
  };
  _links: {
    first: { href: string };
    self: { href: string };
    next?: { href: string };
    last: { href: string };
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
>>>>>>> 1cab5437522ec66ec90fcb67dd3e3a14510935b2
}

export class TicketmasterService {
  private apiKey: string;
  private baseUrl = 'https://app.ticketmaster.com/discovery/v2';
<<<<<<< HEAD

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getEvents(params: EventSearchParams): Promise<TicketmasterEvent[]> {
    if (this.apiKey === 'demo-key') {
      // Return mock data for demo
      return this.getMockEvents();
    }

    try {
      const searchParams = new URLSearchParams({
        apikey: this.apiKey,
        city: params.city || 'Portland',
        classificationName: params.classificationName || 'Sports',
        sort: 'date,asc',
        size: '50'
      });

      if (params.minPrice) searchParams.append('priceMin', params.minPrice);
      if (params.maxPrice) searchParams.append('priceMax', params.maxPrice);

      const response = await fetch(`${this.baseUrl}/events.json?${searchParams}`);
      const data = await response.json();

      return data._embedded?.events || [];
    } catch (error) {
      console.error('Ticketmaster API error:', error);
      return this.getMockEvents();
    }
  }

  async getTrailBlazersEvents(): Promise<TicketmasterEvent[]> {
    return this.getEvents({
      city: 'Portland',
      classificationName: 'Basketball'
    });
  }

  async getPortlandVenues(): Promise<any[]> {
    if (this.apiKey === 'demo-key') {
      return [
        { id: 'venue1', name: 'Moda Center', city: 'Portland' },
        { id: 'venue2', name: 'Providence Park', city: 'Portland' },
        { id: 'venue3', name: 'Theater of the Clouds', city: 'Portland' }
      ];
    }

    try {
      const response = await fetch(`${this.baseUrl}/venues.json?apikey=${this.apiKey}&city=Portland&size=50`);
      const data = await response.json();
      return data._embedded?.venues || [];
    } catch (error) {
      console.error('Venues API error:', error);
      return [];
    }
  }

  private getMockEvents(): TicketmasterEvent[] {
    return [
      {
        id: 'mock1',
        name: 'Portland Trail Blazers vs Los Angeles Lakers',
        dates: {
          start: {
            localDate: '2025-01-15',
            localTime: '19:30:00'
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
          max: 250
        }]
      },
      {
        id: 'mock2', 
        name: 'Portland Timbers vs Seattle Sounders',
        dates: {
          start: {
            localDate: '2025-01-20',
            localTime: '14:00:00'
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
          max: 120
        }]
      }
    ];
  }
}
=======
  private mockMode: boolean;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.mockMode = apiKey === 'demo-key' || !apiKey;
  }

  /**
   * Generate mock data for testing/demo purposes
   */
  private generateMockEvents(): TicketmasterEvent[] {
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
  async searchPortlandEvents(params: {
    keyword?: string;
    classificationName?: string; // Sports, Music, Arts & Theatre, etc.
    size?: number;
    page?: number;
    startDateTime?: string;
    endDateTime?: string;
    sort?: string; // date,asc | name,asc | venueName,asc | random
  }): Promise<TicketmasterResponse> {
    
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
      if (params[key as keyof typeof params] === undefined) {
        queryParams.delete(key);
      }
    });

    try {
      const response = await axios.get(`${this.baseUrl}/events.json`, {
        params: queryParams,
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error('Ticketmaster API error:', error);
      throw new Error('Failed to fetch events from Ticketmaster');
    }
  }

  /**
   * Get Trail Blazers specific events
   */
  async getTrailBlazersEvents(): Promise<TicketmasterEvent[]> {
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
  async getTimbersEvents(): Promise<TicketmasterEvent[]> {
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
  async getModaCenterEvents(): Promise<TicketmasterEvent[]> {
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
  async getEventsByVenue(venueId: string): Promise<TicketmasterEvent[]> {
    const queryParams = new URLSearchParams({
      apikey: this.apiKey,
      venueId,
      sort: 'date,asc',
      size: '100'
    });

    try {
      const response = await axios.get(`${this.baseUrl}/events.json`, {
        params: queryParams,
        timeout: 10000,
      });

      return response.data._embedded?.events || [];
    } catch (error) {
      console.error('Ticketmaster venue events error:', error);
      throw new Error('Failed to fetch venue events');
    }
  }

  /**
   * Get event details by ID
   */
  async getEventDetails(eventId: string): Promise<TicketmasterEvent> {
    const queryParams = new URLSearchParams({
      apikey: this.apiKey,
    });

    try {
      const response = await axios.get(`${this.baseUrl}/events/${eventId}.json`, {
        params: queryParams,
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error('Ticketmaster event details error:', error);
      throw new Error('Failed to fetch event details');
    }
  }

  /**
   * Search venues in Portland
   */
  async searchPortlandVenues(): Promise<any[]> {
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
      const response = await axios.get(`${this.baseUrl}/venues.json`, {
        params: queryParams,
        timeout: 10000,
      });

      return response.data._embedded?.venues || [];
    } catch (error) {
      console.error('Ticketmaster venues error:', error);
      throw new Error('Failed to fetch venues');
    }
  }

  /**
   * Get events with filtering options (alias for searchPortlandEvents)
   */
  async getEvents(params: {
    city?: string;
    classificationName?: string;
    minPrice?: string;
    maxPrice?: string;
    keyword?: string;
    size?: number;
    page?: number;
  }): Promise<TicketmasterEvent[]> {
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
  async getPortlandVenues(): Promise<any[]> {
    return this.searchPortlandVenues();
  }
}

// Portland venue IDs (we'll populate these after API registration)
export const PORTLAND_VENUE_IDS = {
  MODA_CENTER: 'KovZpZAJledA', // Trail Blazers home
  PROVIDENCE_PARK: 'KovZpZAE6nlA', // Timbers home  
  CRYSTAL_BALLROOM: '', // TBD
  ROSELAND_THEATER: '', // TBD
  MCCAW_HALL: '', // TBD
} as const;
>>>>>>> 1cab5437522ec66ec90fcb67dd3e3a14510935b2
