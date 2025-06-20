import axios from 'axios';
import { logger } from '../utils/logger';

export interface EventbriteEvent {
  id: string;
  name: {
    text: string;
    html: string;
  };
  description: {
    text: string;
    html: string;
  };
  url: string;
  start: {
    timezone: string;
    local: string;
    utc: string;
  };
  end: {
    timezone: string;
    local: string;
    utc: string;
  };
  organization_id: string;
  created: string;
  changed: string;
  published: string;
  capacity?: number;
  capacity_is_custom?: boolean;
  status: string;
  currency: string;
  listed: boolean;
  shareable: boolean;
  invite_only: boolean;
  online_event: boolean;
  show_remaining: boolean;
  tx_time_limit?: number;
  hide_start_date: boolean;
  hide_end_date: boolean;
  locale: string;
  is_locked: boolean;
  privacy_setting: string;
  is_series: boolean;
  is_series_parent: boolean;
  inventory_type: string;
  is_reserved_seating: boolean;
  show_pick_a_seat: boolean;
  show_seatmap_thumbnail: boolean;
  show_colors_in_seatmap_thumbnail: boolean;
  source: string;
  is_free: boolean;
  version?: string;
  summary: string;
  logo_id?: string;
  organizer_id: string;
  venue_id?: string;
  category_id?: string;
  subcategory_id?: string;
  format_id?: string;
  resource_uri: string;
  is_externally_ticketed: boolean;
  logo?: {
    id: string;
    url: string;
    crop_mask?: any;
    original: {
      url: string;
      width: number;
      height: number;
    };
  };
  venue?: {
    id: string;
    name: string;
    latitude: string;
    longitude: string;
    address: {
      address_1: string;
      address_2?: string;
      city: string;
      region: string;
      postal_code: string;
      country: string;
      localized_address_display: string;
      localized_area_display: string;
      localized_multi_line_address_display: string[];
    };
    resource_uri: string;
  };
  ticket_classes?: Array<{
    id: string;
    name: string;
    description?: string;
    cost: {
      currency: string;
      display: string;
      value: number;
    };
    fee: {
      currency: string;
      display: string;
      value: number;
    };
    tax: {
      currency: string;
      display: string;
      value: number;
    };
    actual_cost: {
      currency: string;
      display: string;
      value: number;
    };
    actual_fee: {
      currency: string;
      display: string;
      value: number;
    };
    quantity_total?: number;
    quantity_sold: number;
    sales_start: string;
    sales_end: string;
    hidden: boolean;
    include_fee: boolean;
    split_fee: boolean;
    hide_description: boolean;
    auto_hide: boolean;
    auto_hide_before: string;
    auto_hide_after: string;
    sales_start_after: string;
    sales_end_before: string;
    minimum_quantity: number;
    maximum_quantity: number;
    order_confirmation_message?: string;
    resource_uri: string;
  }>;
}

export interface EventbriteSearchParams {
  location?: string;
  categories?: string;
  subcategories?: string;
  formats?: string;
  price?: 'free' | 'paid';
  date_created_changed?: string;
  date_modified?: string;
  user_created?: string;
  user_modified?: string;
  name_filter?: string;
  venue_filter?: string;
  organizer_filter?: string;
  user_filter?: string;
  tracking_code?: string;
  include_unavailable_events?: boolean;
  include_restricted_events?: boolean;
  start_date_range_start?: string;
  start_date_range_end?: string;
  end_date_range_start?: string;
  end_date_range_end?: string;
  last_modified_range_start?: string;
  last_modified_range_end?: string;
  event_group_id?: string;
  modified_since?: string;
  only_public?: boolean;
  location_within?: string;
  page?: number;
  order_by?: string;
  sort_by?: string;
  expand?: string;
}

class EventbriteService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://www.eventbriteapi.com/v3';

  constructor() {
    this.apiKey = process.env.EVENTBRITE_KEY || '';
    this.apiSecret = process.env.EVENTBRITE_SECRET || '';
    
    if (!this.apiKey) {
      logger.warn('Eventbrite API key not found');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Search for events in Portland area
   */
  async searchEvents(params: EventbriteSearchParams = {}): Promise<EventbriteEvent[]> {
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
      if (params.categories) searchParams.append('categories', params.categories);
      if (params.price) searchParams.append('price', params.price);
      if (params.name_filter) searchParams.append('q', params.name_filter);

      logger.info('Fetching events from Eventbrite API', { 
        location: params.location || 'Portland, OR',
        categories: params.categories,
        price: params.price
      });

      const response = await axios.get(`${this.baseUrl}/events/search/?${searchParams}`, {
        headers: this.getHeaders(),
        timeout: 15000
      });

      const events = response.data.events || [];
      logger.info(`Successfully fetched ${events.length} events from Eventbrite`);
      
      return events;
    } catch (error) {
      logger.error('Error searching Eventbrite events:', error);
      throw new Error(`Failed to search Eventbrite events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Portland sports events
   */
  async getPortlandSportsEvents(): Promise<EventbriteEvent[]> {
    return this.searchEvents({
      location: 'Portland, OR',
      categories: '108', // Sports & Fitness category ID
      location_within: '25mi'
    });
  }

  /**
   * Get Portland music events
   */
  async getPortlandMusicEvents(): Promise<EventbriteEvent[]> {
    return this.searchEvents({
      location: 'Portland, OR',
      categories: '103', // Music category ID
      location_within: '25mi'
    });
  }

  /**
   * Get Portland entertainment events
   */
  async getPortlandEntertainmentEvents(): Promise<EventbriteEvent[]> {
    return this.searchEvents({
      location: 'Portland, OR',
      categories: '105', // Performing & Visual Arts category ID
      location_within: '25mi'
    });
  }

  /**
   * Get all Portland events
   */
  async getPortlandEvents(): Promise<EventbriteEvent[]> {
    return this.searchEvents({
      location: 'Portland, OR',
      location_within: '25mi'
    });
  }

  /**
   * Get free events in Portland
   */
  async getFreeEvents(): Promise<EventbriteEvent[]> {
    return this.searchEvents({
      location: 'Portland, OR',
      price: 'free',
      location_within: '25mi'
    });
  }

  /**
   * Get event details by ID
   */
  async getEventDetails(eventId: string): Promise<EventbriteEvent | null> {
    try {
      if (!this.apiKey) {
        logger.warn('Eventbrite API key not available');
        return null;
      }

      const response = await axios.get(`${this.baseUrl}/events/${eventId}/?expand=venue,ticket_classes,organizer`, {
        headers: this.getHeaders(),
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching Eventbrite event ${eventId}:`, error);
      return null;
    }
  }

  /**
   * Convert Eventbrite event to standardized format
   */
  convertToStandardFormat(event: EventbriteEvent) {
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

export default new EventbriteService();
