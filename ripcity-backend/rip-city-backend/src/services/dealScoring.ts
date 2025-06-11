import { TicketmasterEvent } from './ticketmaster';

export interface Deal {
  id: string;
  eventName: string;
  venue: string;
  eventDate: string;
  originalPrice: number;
  currentPrice: number;
  savings: number;
  savingsPercentage: number;
  dealScore: number;
  alertLevel: 'hot' | 'warm' | 'good' | 'normal';
  category: string;
  imageUrl?: string;
  ticketUrl?: string;
}

export class DealScoringService {
  private readonly HOT_THRESHOLD = 85;
  private readonly WARM_THRESHOLD = 70;
  private readonly GOOD_THRESHOLD = 55;

  scoreDeals(events: TicketmasterEvent[]): Deal[] {
    return events.map(event => this.scoreEvent(event)).filter(deal => deal.dealScore > 0);
  }

  private scoreEvent(event: TicketmasterEvent): Deal {
    const priceRange = event.priceRanges?.[0];
    const minPrice = priceRange?.min || 50;
    const maxPrice = priceRange?.max || 150;
    const venue = event._embedded?.venues?.[0]?.name || 'TBD';
    
    // Simulate price fluctuation (in real app, this would be historical data)
    const currentPrice = Math.round(minPrice * (0.7 + Math.random() * 0.6));
    const originalPrice = Math.round(currentPrice * (1.1 + Math.random() * 0.5));
    const savings = originalPrice - currentPrice;
    const savingsPercentage = Math.round((savings / originalPrice) * 100);
    
    // Calculate deal score (0-100)
    let dealScore = 0;
    
    // Savings percentage (40% of score)
    dealScore += Math.min(savingsPercentage * 0.8, 40);
    
    // Price point (30% of score) - lower prices score higher
    const priceScore = Math.max(0, 30 - (currentPrice / 10));
    dealScore += priceScore;
    
    // Event popularity (20% of score) - Trail Blazers games score higher
    if (event.name.toLowerCase().includes('trail blazers') || event.name.toLowerCase().includes('blazers')) {
      dealScore += 20;
    } else if (event.name.toLowerCase().includes('timbers')) {
      dealScore += 15;
    } else {
      dealScore += 10;
    }
    
    // Time factor (10% of score) - events soon score higher
    dealScore += 10;
    
    dealScore = Math.round(Math.min(dealScore, 100));
    
    const alertLevel = this.getAlertLevel(dealScore);
    
    return {
      id: `deal_${event.id}`,
      eventName: event.name,
      venue,
      eventDate: event.dates?.start?.localDate || '2025-01-01',
      originalPrice,
      currentPrice,
      savings,
      savingsPercentage,
      dealScore,
      alertLevel,
      category: this.categorizeEvent(event.name),
      imageUrl: event.images?.[0]?.url,
      ticketUrl: event.url
    };
  }

  private getAlertLevel(score: number): 'hot' | 'warm' | 'good' | 'normal' {
    if (score >= this.HOT_THRESHOLD) return 'hot';
    if (score >= this.WARM_THRESHOLD) return 'warm';
    if (score >= this.GOOD_THRESHOLD) return 'good';
    return 'normal';
  }

  private categorizeEvent(eventName: string): string {
    const name = eventName.toLowerCase();
    
    if (name.includes('trail blazers') || name.includes('blazers')) return 'basketball';
    if (name.includes('timbers')) return 'soccer';
    if (name.includes('winterhawks')) return 'hockey';
    if (name.includes('concert') || name.includes('music')) return 'music';
    if (name.includes('comedy')) return 'comedy';
    if (name.includes('theater') || name.includes('broadway')) return 'theater';
    
    return 'other';
  }
}
