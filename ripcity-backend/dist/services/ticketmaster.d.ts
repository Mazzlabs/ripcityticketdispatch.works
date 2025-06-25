export interface EventSearchParams {
    city?: string;
    classificationName?: string;
    minPrice?: string;
    maxPrice?: string;
    keyword?: string;
    startDateTime?: string;
    endDateTime?: string;
    size?: string;
    sort?: string;
}
export interface TicketmasterEvent {
    id: string;
    name: string;
    type: string;
    url: string;
    locale?: string;
    images?: Array<{
        ratio?: string;
        url: string;
        width: number;
        height: number;
        fallback?: boolean;
    }>;
    sales?: {
        public?: {
            startDateTime?: string;
            startTBD?: boolean;
            endDateTime?: string;
        };
    };
    dates?: {
        start?: {
            localDate?: string;
            localTime?: string;
            dateTime?: string;
        };
    };
    _embedded?: {
        venues?: Array<{
            name: string;
            city?: {
                name: string;
            };
            state?: {
                name: string;
            };
        }>;
    };
    priceRanges?: Array<{
        type: string;
        currency: string;
        min: number;
        max: number;
    }>;
}
export interface TicketmasterResponse {
    _embedded?: {
        events?: TicketmasterEvent[];
    };
    page?: {
        size: number;
        totalElements: number;
        totalPages: number;
        number: number;
    };
}
declare class TicketmasterService {
    private apiKey;
    private baseUrl;
    constructor();
    searchEvents(params?: EventSearchParams): Promise<TicketmasterEvent[]>;
    getBlazersEvents(): Promise<TicketmasterEvent[]>;
    getPortlandEvents(): Promise<TicketmasterEvent[]>;
    getEventById(eventId: string): Promise<TicketmasterEvent | null>;
    getVenues(city?: string): Promise<any[]>;
}
declare const ticketmasterService: TicketmasterService;
export { TicketmasterService };
export default ticketmasterService;
