import { VercelRequest, VercelResponse } from '@vercel/node';
import { TicketmasterService } from '../services/ticketmaster';
import { DealScoringService } from '../services/dealScoring';

// This will be set as an environment variable
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || '';

if (!TICKETMASTER_API_KEY) {
  console.warn('TICKETMASTER_API_KEY not set - API will not work');
}

const ticketmasterService = new TicketmasterService(TICKETMASTER_API_KEY);
const dealScoringService = new DealScoringService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { 
      category, 
      maxPrice, 
      minSavings = '15',
      venue,
      sortBy = 'score',
      limit = '20'
    } = req.query;

    console.log('Fetching deals with params:', { category, maxPrice, minSavings, venue, sortBy, limit });

    // Fetch events from Ticketmaster
    const events = await ticketmasterService.searchPortlandEvents({
      classificationName: category === 'sports' ? 'Sports' : 
                         category === 'music' ? 'Music' : undefined,
      size: parseInt(limit as string) * 2, // Get more to filter down
      sort: 'date,asc'
    });

    if (!events._embedded?.events) {
      res.status(200).json({ deals: [], total: 0 });
      return;
    }

    // Score each event as a potential deal
    const deals = events._embedded.events
      .map(event => {
        // Determine venue popularity (1-10)
        const venuePopularity = getVenuePopularity(event._embedded?.venues?.[0]?.name);
        
        // Determine event popularity (1-10)
        const eventPopularity = getEventPopularity(event.name, event.classifications?.[0]);

        // Calculate days until event
        const eventDate = new Date(event.dates.start.dateTime || event.dates.start.localDate);
        const timeUntilEvent = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        return dealScoringService.scoreDeal(event, {
          minSavingsPercentage: parseInt(minSavings as string),
          maxPriceThreshold: maxPrice ? parseInt(maxPrice as string) : undefined,
          venuePopularity,
          eventPopularity,
          timeUntilEvent: Math.max(timeUntilEvent, 0)
        });
      })
      .filter((deal): deal is NonNullable<typeof deal> => deal !== null);

    // Apply filters
    const filteredDeals = dealScoringService.filterDeals(deals, {
      categories: category ? [category as any] : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
      minSavings: parseInt(minSavings as string),
      venues: venue ? [venue as string] : undefined
    });

    // Sort and limit results
    const sortedDeals = dealScoringService.sortDeals(filteredDeals, sortBy as any)
      .slice(0, parseInt(limit as string));

    res.status(200).json({
      deals: sortedDeals,
      total: filteredDeals.length,
      fetched: sortedDeals.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch deals',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getVenuePopularity(venueName?: string): number {
  if (!venueName) return 5;
  
  const name = venueName.toLowerCase();
  
  // Portland venue popularity scoring
  if (name.includes('moda center')) return 10; // Trail Blazers home
  if (name.includes('providence park')) return 9; // Timbers home
  if (name.includes('crystal ballroom')) return 8;
  if (name.includes('roseland theater')) return 7;
  if (name.includes('doug fir')) return 6;
  if (name.includes('revolution hall')) return 7;
  if (name.includes('veterans memorial')) return 8;
  
  return 5; // Default for unknown venues
}

function getEventPopularity(eventName: string, classification?: any): number {
  const name = eventName.toLowerCase();
  
  // Trail Blazers games are always popular in Portland
  if (name.includes('trail blazers') || name.includes('blazers')) {
    if (name.includes('playoff') || name.includes('lakers') || name.includes('warriors')) {
      return 10;
    }
    return 9;
  }
  
  // Timbers games
  if (name.includes('timbers')) {
    if (name.includes('playoff') || name.includes('seattle') || name.includes('sounders')) {
      return 10;
    }
    return 8;
  }
  
  // Major touring acts
  if (name.includes('taylor swift') || name.includes('beyonce') || name.includes('drake')) {
    return 10;
  }
  
  // Other sports
  if (classification?.segment?.name?.toLowerCase().includes('sport')) {
    return 7;
  }
  
  // Music events
  if (classification?.segment?.name?.toLowerCase().includes('music')) {
    return 6;
  }
  
  return 5; // Default
}
