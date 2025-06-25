import { TicketmasterEvent } from './ticketmaster';
import { AggregatedEvent } from './eventAggregation';
export interface Deal {
    id: string;
    eventName: string;
    venue: string;
    eventDate: string;
    originalPrice: number;
    currentPrice: number;
    savings: number;
    savingsPercent: number;
    dealScore: number;
    alertLevel: 'hot' | 'warm' | 'good' | 'normal';
    category: string;
    imageUrl?: string;
    ticketUrl?: string;
}
export declare class DealScoringService {
    private readonly HOT_THRESHOLD;
    private readonly WARM_THRESHOLD;
    private readonly GOOD_THRESHOLD;
    scoreDeals(events: TicketmasterEvent[]): Deal[];
    scoreDeals(events: AggregatedEvent[]): Deal[];
    private scoreTicketmasterEvent;
    private scoreAggregatedEvent;
    private getAlertLevel;
    private categorizeEvent;
}
