const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Ticketmaster Discovery API Service
 * 
 * Provides methods to fetch sports events, venues, and pricing information
 * from the Ticketmaster Discovery API for affiliate integration.
 */
class TicketmasterService {
  constructor() {
    this.apiKey = process.env.TICKETMASTER_KEY;
    this.baseURL = 'https://app.ticketmaster.com/discovery/v2';
    this.affiliateId = process.env.TICKETMASTER_AFFILIATE_ID || 'ripcitytickets';
    
    if (!this.apiKey) {
      console.warn('⚠️  TICKETMASTER_KEY is not set. Ticketmaster integration will be unavailable.');
    }
  }

  /**
   * Check if Ticketmaster service is available
   */
  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Fetch sports events from Ticketmaster API
   * @param {Object} options - Query parameters
   * @param {string} options.city - City name (e.g., 'Portland')
   * @param {string} options.classificationName - Sports type (e.g., 'Basketball')
   * @param {string} options.keyword - Search keyword (e.g., 'Trail Blazers')
   * @param {number} options.size - Number of events to fetch (default: 20)
   * @param {number} options.page - Page number for pagination (default: 0)
   * @returns {Promise<Object>} Event data from Ticketmaster
   */
  async getSportsEvents(options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Ticketmaster API key not configured');
    }

    const params = {
      apikey: this.apiKey,
      classificationName: options.classificationName || 'Sports',
      size: options.size || 20,
      page: options.page || 0,
      sort: 'date,asc',
      ...options
    };

    try {
      const response = await axios.get(`${this.baseURL}/events.json`, { params });
      return response.data;
    } catch (error) {
      console.error('Ticketmaster API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch events from Ticketmaster');
    }
  }

  /**
   * Get Portland Trail Blazers specific events
   * @param {Object} options - Additional query options
   * @returns {Promise<Object>} Trail Blazers events
   */
  async getTrailBlazersEvents(options = {}) {
    return this.getSportsEvents({
      keyword: 'Portland Trail Blazers',
      classificationName: 'Basketball',
      city: 'Portland',
      stateCode: 'OR',
      ...options
    });
  }

  /**
   * Get NBA events
   * @param {Object} options - Additional query options
   * @returns {Promise<Object>} NBA events
   */
  async getNBAEvents(options = {}) {
    return this.getSportsEvents({
      classificationName: 'Basketball',
      keyword: 'NBA',
      ...options
    });
  }

  /**
   * Get NFL events
   * @param {Object} options - Additional query options
   * @returns {Promise<Object>} NFL events
   */
  async getNFLEvents(options = {}) {
    return this.getSportsEvents({
      classificationName: 'Football',
      keyword: 'NFL',
      ...options
    });
  }

  /**
   * Get MLB events
   * @param {Object} options - Additional query options
   * @returns {Promise<Object>} MLB events
   */
  async getMLBEvents(options = {}) {
    return this.getSportsEvents({
      classificationName: 'Baseball',
      keyword: 'MLB',
      ...options
    });
  }

  /**
   * Get NHL events
   * @param {Object} options - Additional query options
   * @returns {Promise<Object>} NHL events
   */
  async getNHLEvents(options = {}) {
    return this.getSportsEvents({
      classificationName: 'Hockey',
      keyword: 'NHL',
      ...options
    });
  }

  /**
   * Get venue details by ID
   * @param {string} venueId - Ticketmaster venue ID
   * @returns {Promise<Object>} Venue information
   */
  async getVenue(venueId) {
    if (!this.isAvailable()) {
      throw new Error('Ticketmaster API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseURL}/venues/${venueId}.json`, {
        params: { apikey: this.apiKey }
      });
      return response.data;
    } catch (error) {
      console.error('Ticketmaster venue API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch venue from Ticketmaster');
    }
  }

  /**
   * Transform Ticketmaster event to our Event model format
   * @param {Object} tmEvent - Ticketmaster event object
   * @returns {Object} Event data compatible with our schema
   */
  transformEvent(tmEvent) {
    const venue = tmEvent._embedded?.venues?.[0];
    const priceRanges = tmEvent.priceRanges || [];
    
    // Extract team names from the event
    const teams = this.extractTeamNames(tmEvent);
    
    return {
      name: tmEvent.name,
      date: new Date(tmEvent.dates.start.dateTime || tmEvent.dates.start.localDate),
      league: this.extractLeague(tmEvent),
      teams: teams,
      location: venue ? `${venue.name}, ${venue.city?.name}, ${venue.state?.stateCode}` : '',
      affiliateLink: this.generateAffiliateLink(tmEvent.url),
      ticketmaster: {
        id: tmEvent.id,
        url: tmEvent.url,
        priceRanges: priceRanges.map(pr => ({
          type: pr.type,
          currency: pr.currency,
          min: pr.min,
          max: pr.max
        })),
        venue: venue ? {
          name: venue.name,
          address: venue.address?.line1,
          city: venue.city?.name,
          state: venue.state?.stateCode,
          country: venue.country?.countryCode,
          postalCode: venue.postalCode
        } : {},
        sales: {
          public: {
            startDateTime: tmEvent.sales?.public?.startDateTime ? new Date(tmEvent.sales.public.startDateTime) : null,
            endDateTime: tmEvent.sales?.public?.endDateTime ? new Date(tmEvent.sales.public.endDateTime) : null
          }
        },
        seatmap: {
          staticUrl: tmEvent.seatmap?.staticUrl
        }
      },
      status: 'upcoming',
      featured: this.isFeaturedEvent(tmEvent)
    };
  }

  /**
   * Extract team names from Ticketmaster event
   * @param {Object} tmEvent - Ticketmaster event
   * @returns {Array<string>} Team names
   */
  extractTeamNames(tmEvent) {
    // Try to extract from attractions (teams/performers)
    const attractions = tmEvent._embedded?.attractions || [];
    const teams = attractions
      .filter(attr => attr.classifications?.[0]?.segment?.name === 'Sports')
      .map(attr => attr.name);
    
    if (teams.length >= 2) {
      return teams.slice(0, 2); // Take first two teams
    }
    
    // Fallback: try to parse from event name
    const eventName = tmEvent.name;
    const vsMatch = eventName.match(/(.+?)\s+(?:vs\.?|v\.?|@)\s+(.+)/i);
    if (vsMatch) {
      return [vsMatch[1].trim(), vsMatch[2].trim()];
    }
    
    // If we can't extract teams, use the event name as a single "team"
    return [eventName];
  }

  /**
   * Extract league information from Ticketmaster event
   * @param {Object} tmEvent - Ticketmaster event
   * @returns {string} League name
   */
  extractLeague(tmEvent) {
    const classification = tmEvent.classifications?.[0];
    if (classification?.subGenre?.name) {
      return classification.subGenre.name;
    }
    if (classification?.genre?.name) {
      return classification.genre.name;
    }
    return 'Sports';
  }

  /**
   * Check if event should be featured
   * @param {Object} tmEvent - Ticketmaster event
   * @returns {boolean} Whether event should be featured
   */
  isFeaturedEvent(tmEvent) {
    const eventName = tmEvent.name.toLowerCase();
    const featuredTeams = ['portland trail blazers', 'trail blazers'];
    
    return featuredTeams.some(team => eventName.includes(team));
  }

  /**
   * Generate affiliate link for Ticketmaster URL
   * @param {string} tmUrl - Original Ticketmaster URL
   * @returns {string} URL with affiliate tracking
   */
  generateAffiliateLink(tmUrl) {
    if (!tmUrl) return '';
    
    // Add affiliate tracking parameters
    const url = new URL(tmUrl);
    url.searchParams.set('affiliateId', this.affiliateId);
    url.searchParams.set('utm_source', 'ripcitytickets');
    url.searchParams.set('utm_medium', 'affiliate');
    url.searchParams.set('utm_campaign', 'sports_events');
    
    return url.toString();
  }

  /**
   * Sync events from Ticketmaster to database
   * @param {Object} Event - Mongoose Event model
   * @param {Object} options - Sync options
   * @returns {Promise<Array>} Created/updated events
   */
  async syncEvents(Event, options = {}) {
    if (!this.isAvailable()) {
      console.warn('Ticketmaster sync skipped - API key not configured');
      return [];
    }

    const syncedEvents = [];
    
    try {
      // Fetch Trail Blazers events (priority)
      const blazersData = await this.getTrailBlazersEvents({ size: 10 });
      const blazersEvents = blazersData._embedded?.events || [];
      
      // Fetch other sports events
      const nbaData = await this.getNBAEvents({ size: 20 });
      const nbaEvents = nbaData._embedded?.events || [];
      
      const allEvents = [...blazersEvents, ...nbaEvents];
      
      for (const tmEvent of allEvents) {
        const eventData = this.transformEvent(tmEvent);
        
        // Check if event already exists
        const existingEvent = await Event.findOne({ 'ticketmaster.id': tmEvent.id });
        
        if (existingEvent) {
          // Update existing event
          Object.assign(existingEvent, eventData);
          await existingEvent.save();
          syncedEvents.push(existingEvent);
        } else {
          // Create new event
          const newEvent = new Event(eventData);
          await newEvent.save();
          syncedEvents.push(newEvent);
        }
      }
      
      console.log(`✅ Synced ${syncedEvents.length} events from Ticketmaster`);
      return syncedEvents;
      
    } catch (error) {
      console.error('Ticketmaster sync error:', error.message);
      throw error;
    }
  }
}

module.exports = new TicketmasterService();