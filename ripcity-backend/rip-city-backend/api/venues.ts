import { VercelRequest, VercelResponse } from '@vercel/node';
import { TicketmasterService } from '../src/services/ticketmaster';

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || '';
const ticketmasterService = new TicketmasterService(TICKETMASTER_API_KEY);

// Portland venue metadata
const PORTLAND_VENUES = {
  'moda center': {
    capacity: 19393,
    type: 'arena',
    teams: ['Portland Trail Blazers'],
    description: 'Home of the Portland Trail Blazers',
    address: '1 Center Ct, Portland, OR 97227',
    parking: 'Multiple lots and garages available',
    tips: 'Arrive early for Trail Blazers games - traffic can be heavy'
  },
  'providence park': {
    capacity: 25218,
    type: 'stadium',
    teams: ['Portland Timbers', 'Portland Thorns FC'],
    description: 'Home of the Portland Timbers and Thorns',
    address: '1844 SW Morrison St, Portland, OR 97205',
    parking: 'Limited - public transit recommended',
    tips: 'Take MAX Light Rail to avoid parking hassles'
  },
  'crystal ballroom': {
    capacity: 1500,
    type: 'concert hall',
    teams: [],
    description: 'Historic music venue with unique floating dance floor',
    address: '1332 W Burnside St, Portland, OR 97209',
    parking: 'Street parking only',
    tips: 'Cash bar only - no cards accepted'
  }
} as const;

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
    console.log('Fetching Portland venues...');

    // Get venues from Ticketmaster
    const venues = await ticketmasterService.searchPortlandVenues();
    
    // Enhance with local metadata
    const enhancedVenues = venues.map(venue => {
      const venueName = venue.name.toLowerCase();
      const metadata = Object.entries(PORTLAND_VENUES).find(([key]) => 
        venueName.includes(key)
      )?.[1];

      return {
        id: venue.id,
        name: venue.name,
        address: venue.address?.line1,
        city: venue.city?.name,
        state: venue.state?.stateCode,
        postalCode: venue.postalCode,
        location: venue.location,
        timezone: venue.timezone,
        ...metadata,
        // Add popularity score for deal scoring
        popularity: getVenuePopularity(venue.name)
      };
    });

    // Sort by popularity/importance
    const sortedVenues = enhancedVenues.sort((a, b) => b.popularity - a.popularity);

    res.status(200).json({
      venues: sortedVenues,
      total: sortedVenues.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ 
      error: 'Failed to fetch venues',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getVenuePopularity(venueName: string): number {
  const name = venueName.toLowerCase();
  
  if (name.includes('moda center')) return 10;
  if (name.includes('providence park')) return 9;
  if (name.includes('crystal ballroom')) return 8;
  if (name.includes('roseland theater')) return 7;
  if (name.includes('revolution hall')) return 7;
  if (name.includes('doug fir')) return 6;
  if (name.includes('veterans memorial')) return 8;
  if (name.includes('keller auditorium')) return 7;
  if (name.includes('arlene schnitzer')) return 8;
  
  return 5;
}
