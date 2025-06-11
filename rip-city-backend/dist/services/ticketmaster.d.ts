export interface TicketmasterEvent {
    id: string;
    name: string;
    type: string;
    url: string;
    locale: string;
    images: Array<{
        ratio: string;
        url: string;
        width: number;
        height: number;
        fallback: boolean;
    }>;
    sales: {
        public: {
            startDateTime: string;
            startTBD: boolean;
            endDateTime: string;
        };
    };
    dates: {
        start: {
            localDate: string;
            localTime: string;
            dateTime: string;
            dateTBD: boolean;
            dateTBA: boolean;
            timeTBA: boolean;
            noSpecificTime: boolean;
        };
        timezone: string;
        status: {
            code: string;
        };
    };
    classifications: Array<{
        primary: boolean;
        segment: {
            id: string;
            name: string;
        };
        genre: {
            id: string;
            name: string;
        };
        subGenre: {
            id: string;
            name: string;
        };
    }>;
    priceRanges?: Array<{
        type: string;
        currency: string;
        min: number;
        max: number;
    }>;
    _embedded?: {
        venues: Array<{
            id: string;
            name: string;
            type: string;
            locale: string;
            postalCode: string;
            timezone: string;
            city: {
                name: string;
            };
            state: {
                name: string;
                stateCode: string;
            };
            country: {
                name: string;
                countryCode: string;
            };
            address: {
                line1: string;
            };
            location: {
                longitude: string;
                latitude: string;
            };
        }>;
    };
}
export interface TicketmasterResponse {
    _embedded?: {
        events: TicketmasterEvent[];
    };
    _links: {
        first: {
            href: string;
        };
        self: {
            href: string;
        };
        next?: {
            href: string;
        };
        last: {
            href: string;
        };
    };
    page: {
        size: number;
        totalElements: number;
        totalPages: number;
        number: number;
    };
}
export declare class TicketmasterService {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    /**
     * Search for events in Portland area
     */
    searchPortlandEvents(params: {
        keyword?: string;
        classificationName?: string;
        size?: number;
        page?: number;
        startDateTime?: string;
        endDateTime?: string;
        sort?: string;
    }): Promise<TicketmasterResponse>;
    /**
     * Get Trail Blazers specific events
     */
    getTrailBlazersEvents(): Promise<TicketmasterEvent[]>;
    /**
     * Get Portland Timbers events
     */
    getTimbersEvents(): Promise<TicketmasterEvent[]>;
    /**
     * Get Moda Center events
     */
    getModaCenterEvents(): Promise<TicketmasterEvent[]>;
    /**
     * Get events by venue ID
     */
    getEventsByVenue(venueId: string): Promise<TicketmasterEvent[]>;
    /**
     * Get event details by ID
     */
    getEventDetails(eventId: string): Promise<TicketmasterEvent>;
    /**
     * Search venues in Portland
     */
    searchPortlandVenues(): Promise<any[]>;
    /**
     * Get events with filtering options (alias for searchPortlandEvents)
     */
    getEvents(params: {
        city?: string;
        classificationName?: string;
        minPrice?: string;
        maxPrice?: string;
        keyword?: string;
        size?: number;
        page?: number;
    }): Promise<TicketmasterEvent[]>;
    /**
     * Get Portland venues (alias for searchPortlandVenues)
     */
    getPortlandVenues(): Promise<any[]>;
}
export declare const PORTLAND_VENUE_IDS: {
    readonly MODA_CENTER: "KovZpZAJledA";
    readonly PROVIDENCE_PARK: "KovZpZAE6nlA";
    readonly CRYSTAL_BALLROOM: "";
    readonly ROSELAND_THEATER: "";
    readonly MCCAW_HALL: "";
};
//# sourceMappingURL=ticketmaster.d.ts.map