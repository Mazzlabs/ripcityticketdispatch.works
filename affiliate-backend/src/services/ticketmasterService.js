/**
 * Ticketmaster Discovery API Service
 * 
 * Provides integration with the Ticketmaster Discovery API for real-time
 * event data and ticket purchasing capabilities. Includes rate limiting,
 * caching, and error handling for production use.
 */

const dotenv = require('dotenv');
dotenv.config();

// Rate limiting configuration
const RATE_LIMIT = {
  requests: 1000, // Per day limit from Ticketmaster
  window: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  current: 0,
  lastReset: Date.now()
};

// Simple in-memory cache (in production, consider Redis)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Check if we're within rate limits
 */
function checkRateLimit() {
  const now = Date.now();
  
  // Reset counter if 24 hours have passed
  if (now - RATE_LIMIT.lastReset > RATE_LIMIT.window) {
    RATE_LIMIT.current = 0;
    RATE_LIMIT.lastReset = now;
  }
  
  return RATE_LIMIT.current < RATE_LIMIT.requests;
}

/**
 * Make a rate-limited request to Ticketmaster API
 */
async function makeTicketmasterRequest(endpoint, params = {}) {
  // Check rate limit
  if (!checkRateLimit()) {
    throw new Error('Ticketmaster API rate limit exceeded');
  }
  
  // Check cache first
  const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Prepare API request
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    throw new Error('TICKETMASTER_API_KEY not configured');
  }
  
  const url = new URL(`https://app.ticketmaster.com/discovery/v2/${endpoint}.json`);
  url.searchParams.set('apikey', apiKey);
  
  // Add additional parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });
  
  try {
    RATE_LIMIT.current++;
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the response
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    console.error('Ticketmaster API request failed:', error);
    throw error;
  }
}

/**
 * Search for events using Ticketmaster Discovery API
 * 
 * @param {Object} searchParams - Search parameters
 * @param {string} searchParams.keyword - Event or venue name
 * @param {string} searchParams.classificationName - Sport/segment name (e.g., 'Basketball', 'Football')
 * @param {string} searchParams.city - City name
 * @param {string} searchParams.stateCode - State code (e.g., 'OR', 'WA')
 * @param {string} searchParams.startDateTime - Start date in ISO format
 * @param {string} searchParams.endDateTime - End date in ISO format
 * @param {number} searchParams.size - Number of events to return (max 200)
 * @param {number} searchParams.page - Page number (starts at 0)
 * @returns {Promise<Object>} Ticketmaster API response
 */
async function searchEvents(searchParams = {}) {
  const params = {
    ...searchParams,
    size: searchParams.size || 20,
    page: searchParams.page || 0,
    sort: 'date,asc'
  };
  
  return await makeTicketmasterRequest('events', params);
}

/**
 * Get detailed information about a specific event
 * 
 * @param {string} eventId - Ticketmaster event ID
 * @returns {Promise<Object>} Event details
 */
async function getEventDetails(eventId) {
  return await makeTicketmasterRequest(`events/${eventId}`);
}

/**
 * Search for sports events specifically
 * 
 * @param {Object} sportParams - Sports-specific search parameters
 * @param {string} sportParams.sport - Sport name (Basketball, Football, etc.)
 * @param {string} sportParams.city - City name
 * @param {number} sportParams.daysAhead - Number of days ahead to search
 * @returns {Promise<Object>} Sports events
 */
async function searchSportsEvents(sportParams = {}) {
  const { sport, city, daysAhead = 30 } = sportParams;
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + daysAhead);
  
  const params = {
    classificationName: sport,
    city: city,
    startDateTime: startDate.toISOString().split('.')[0] + 'Z',
    endDateTime: endDate.toISOString().split('.')[0] + 'Z',
    size: 50
  };
  
  return await searchEvents(params);
}

/**
 * Convert Ticketmaster event to our Event model format
 * 
 * @param {Object} tmEvent - Ticketmaster event object
 * @returns {Object} Event data in our format
 */
function convertTicketmasterEvent(tmEvent) {
  // Extract team names from the event name
  const eventName = tmEvent.name || '';
  const teams = extractTeamNames(eventName);
  
  // Get venue information
  const venue = tmEvent._embedded?.venues?.[0];
  const city = venue?.city?.name || '';
  const state = venue?.state?.stateCode || '';
  const location = city && state ? `${city}, ${state}` : (venue?.name || '');
  
  // Get classification info
  const classification = tmEvent.classifications?.[0];
  const sport = classification?.sport?.name || classification?.segment?.name || 'Sports';
  
  // Get price range
  const priceRange = tmEvent.priceRanges?.[0];
  
  return {
    name: eventName,
    date: new Date(tmEvent.dates?.start?.dateTime || tmEvent.dates?.start?.localDate),
    league: sport,
    teams: teams.length > 0 ? teams : [eventName],
    location: location,
    affiliateLink: generateAffiliateLink(tmEvent.url),
    ticketmaster: {
      id: tmEvent.id,
      url: tmEvent.url,
      priceRange: priceRange ? {
        min: priceRange.min,
        max: priceRange.max,
        currency: priceRange.currency
      } : null,
      venue: venue ? {
        name: venue.name,
        city: city,
        state: state
      } : null,
      classification: {
        genre: classification?.genre?.name,
        subGenre: classification?.subGenre?.name,
        type: classification?.type?.name
      },
      sales: tmEvent.sales?.public ? {
        public: {
          startDateTime: tmEvent.sales.public.startDateTime ? new Date(tmEvent.sales.public.startDateTime) : null,
          endDateTime: tmEvent.sales.public.endDateTime ? new Date(tmEvent.sales.public.endDateTime) : null
        }
      } : null
    }
  };
}

/**
 * Extract team names from event title
 * This is a simple implementation - could be enhanced with ML/NLP
 */
function extractTeamNames(eventName) {
  // Common patterns for team vs team events
  const vsPattern = /(.+?)\s+(?:vs\.?|at)\s+(.+)/i;
  const match = eventName.match(vsPattern);
  
  if (match) {
    return [match[1].trim(), match[2].trim()];
  }
  
  // If no clear vs pattern, return empty array
  return [];
}

/**
 * Generate affiliate link for ticket purchasing
 * Integrates with existing RIPCITYTICKETS affiliate system
 */
function generateAffiliateLink(ticketmasterUrl) {
  if (!ticketmasterUrl) return null;
  
  // For now, return the original URL
  // In production, this would integrate with affiliate tracking
  return ticketmasterUrl;
}

/**
 * Get current rate limit status
 */
function getRateLimitStatus() {
  return {
    remaining: RATE_LIMIT.requests - RATE_LIMIT.current,
    total: RATE_LIMIT.requests,
    resetTime: RATE_LIMIT.lastReset + RATE_LIMIT.window
  };
}

module.exports = {
  searchEvents,
  getEventDetails,
  searchSportsEvents,
  convertTicketmasterEvent,
  getRateLimitStatus
};