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
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
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
}

export class TicketmasterService {
  private apiKey: string;
  private baseUrl = 'https://app.ticketmaster.com/discovery/v2';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
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
