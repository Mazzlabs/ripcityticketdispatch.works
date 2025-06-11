import { TicketmasterEvent } from './ticketmaster';
export interface Deal {
    id: string;
    eventId: string;
    eventName: string;
    venue: string;
    date: string;
    time: string;
    originalPrice: number;
    currentPrice: number;
    savings: number;
    savingsPercentage: number;
    dealScore: number;
    confidence: number;
    platform: 'ticketmaster' | 'stubhub' | 'seatgeek' | 'vivid_seats';
    section: string;
    row: string;
    seatCount: number;
    category: 'sports' | 'music' | 'theater' | 'family' | 'other';
    alertLevel: 'hot' | 'warm' | 'good' | 'normal';
    tags: string[];
    url: string;
    imageUrl?: string;
    lastUpdated: Date;
}
export interface DealScoringCriteria {
    minSavingsPercentage: number;
    maxPriceThreshold?: number;
    venuePopularity: number;
    eventPopularity: number;
    timeUntilEvent: number;
    historicalPricing?: {
        averagePrice: number;
        lowestSeen: number;
        highestSeen: number;
    };
}
export declare class DealScoringService {
    private readonly HOT_DEAL_THRESHOLD;
    private readonly WARM_DEAL_THRESHOLD;
    private readonly GOOD_DEAL_THRESHOLD;
    /**
     * Score a potential deal from Ticketmaster event data
     */
    scoreDeal(event: TicketmasterEvent, criteria: DealScoringCriteria): Deal | null;
    /**
     * Score multiple events and return all viable deals
     */
    scoreDeals(events: TicketmasterEvent[], criteria?: Partial<DealScoringCriteria>): Deal[];
    private calculateDealScore;
    private calculateConfidence;
    private categorizeEvent;
    private getAlertLevel;
    private generateTags;
    /**
     * Filter deals based on user preferences
     */
    filterDeals(deals: Deal[], filters: {
        categories?: Deal['category'][];
        maxPrice?: number;
        minSavings?: number;
        venues?: string[];
        alertLevels?: Deal['alertLevel'][];
    }): Deal[];
    /**
     * Sort deals by relevance/score
     */
    sortDeals(deals: Deal[], sortBy?: 'score' | 'savings' | 'price' | 'date'): Deal[];
}
//# sourceMappingURL=dealScoring.d.ts.map