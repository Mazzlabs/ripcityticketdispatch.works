export interface AggregatedEvent {
    id: string;
    name: string;
    venue: string;
    city: string;
    date: string;
    time: string;
    url: string;
    image: string;
    minPrice: number;
    maxPrice: number;
    currency: string;
    category: string;
    source: 'ticketmaster' | 'eventbrite';
    isFree?: boolean;
    description?: string;
    dealScore?: number;
    savings?: number;
    originalPrice?: number;
}
export interface SearchFilters {
    category?: 'sports' | 'music' | 'entertainment' | 'all';
    maxPrice?: number;
    minPrice?: number;
    venue?: string;
    dateRange?: {
        start: string;
        end: string;
    };
    includeFreeEvents?: boolean;
    sources?: ('ticketmaster' | 'eventbrite')[];
}
declare class EventAggregationService {
    private dealScoringService;
    constructor();
    /**
     * Search events across all sources
     */
    searchAllEvents(filters?: SearchFilters): Promise<AggregatedEvent[]>;
    /**
     * Get events from Ticketmaster
     */
    private getTicketmasterEvents;
    /**
     * Get events from Eventbrite
     */
    private getEventbriteEvents;
    /**
     * Remove duplicate events based on name and date similarity
     */
    private removeDuplicates;
    /**
     * Apply additional filters to events
     */
    private applyFilters;
    /**
     * Score events using the deal scoring service
     */
    private scoreEvents;
    /**
     * Get category from Ticketmaster event
     */
    private getTicketmasterCategory;
    /**
     * Get category from Eventbrite event based on category_id
     */
    private getEventbriteCategory;
    /**
     * Get hot deals across all sources
     */
    getHotDeals(limit?: number): Promise<AggregatedEvent[]>;
    /**
     * Get free events across all sources
     */
    getFreeEvents(limit?: number): Promise<AggregatedEvent[]>;
    /**
     * Search events by name across all sources
     */
    searchByName(query: string): Promise<AggregatedEvent[]>;
}
declare const _default: EventAggregationService;
export default _default;
