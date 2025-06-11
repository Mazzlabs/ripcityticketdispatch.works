import { VercelRequest, VercelResponse } from '@vercel/node';
import { TicketmasterService } from '../src/services/ticketmaster';
import { DealScoringService } from '../src/services/dealScoring';

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || '';
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
    console.log('Fetching Trail Blazers events...');

    // Get Trail Blazers events
    const events = await ticketmasterService.getTrailBlazersEvents();
    
    if (events.length === 0) {
      res.status(200).json({ 
        deals: [], 
        total: 0,
        message: 'No Trail Blazers events found'
      });
      return;
    }

    // Score each game as a potential deal
    const deals = events
      .map(event => {
        const eventDate = new Date(event.dates.start.dateTime || event.dates.start.localDate);
        const timeUntilEvent = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        // Trail Blazers games always get high popularity scores
        let eventPopularity = 9;
        if (event.name.toLowerCase().includes('playoff')) eventPopularity = 10;
        if (event.name.toLowerCase().includes('lakers')) eventPopularity = 10;
        if (event.name.toLowerCase().includes('warriors')) eventPopularity = 10;

        return dealScoringService.scoreDeal(event, {
          minSavingsPercentage: 10, // Lower threshold for Blazers games
          venuePopularity: 10, // Moda Center is always 10
          eventPopularity,
          timeUntilEvent: Math.max(timeUntilEvent, 0)
        });
      })
      .filter((deal): deal is NonNullable<typeof deal> => deal !== null);

    // Sort by deal score and date
    const sortedDeals = dealScoringService.sortDeals(deals, 'score');

    // Add special Rip City metadata
    const ripCityDeals = sortedDeals.map(deal => ({
      ...deal,
      tags: [...deal.tags, 'RIP CITY'],
      category: 'sports' as const,
      specialNotes: getGameNotes(deal.eventName)
    }));

    res.status(200).json({
      deals: ripCityDeals,
      total: ripCityDeals.length,
      lastUpdated: new Date().toISOString(),
      specialMessage: getSpecialMessage(ripCityDeals.length)
    });

  } catch (error) {
    console.error('Error fetching Trail Blazers deals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Trail Blazers deals',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getGameNotes(eventName: string): string {
  const name = eventName.toLowerCase();
  
  if (name.includes('lakers')) {
    return '🔥 Lakers rivalry game - always exciting!';
  }
  if (name.includes('warriors')) {
    return '⚡ Warriors showdown - high-energy game!';
  }
  if (name.includes('playoff')) {
    return '🏆 PLAYOFF GAME - Don\'t miss this!';
  }
  if (name.includes('opener') || name.includes('home opener')) {
    return '🏠 Home opener - special atmosphere!';
  }
  
  return '🏀 Trail Blazers home game at Moda Center';
}

function getSpecialMessage(dealCount: number): string {
  if (dealCount === 0) {
    return '🏀 No Blazers deals right now - check back soon!';
  }
  if (dealCount >= 5) {
    return `🔥 ${dealCount} hot Blazers deals available - Rip City!`;
  }
  if (dealCount >= 3) {
    return `⚡ ${dealCount} Blazers deals found - time to rep Portland!`;
  }
  return `🏀 ${dealCount} Blazers deal${dealCount > 1 ? 's' : ''} - get your tickets!`;
}
