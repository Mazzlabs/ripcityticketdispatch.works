export interface EventbriteEvent {
    id: string;
    name: {
        text: string;
        html: string;
    };
    description: {
        text: string;
        html: string;
    };
    url: string;
    start: {
        timezone: string;
        local: string;
        utc: string;
    };
    end: {
        timezone: string;
        local: string;
        utc: string;
    };
    organization_id: string;
    created: string;
    changed: string;
    published: string;
    capacity?: number;
    capacity_is_custom?: boolean;
    status: string;
    currency: string;
    listed: boolean;
    shareable: boolean;
    invite_only: boolean;
    online_event: boolean;
    show_remaining: boolean;
    tx_time_limit?: number;
    hide_start_date: boolean;
    hide_end_date: boolean;
    locale: string;
    is_locked: boolean;
    privacy_setting: string;
    is_series: boolean;
    is_series_parent: boolean;
    inventory_type: string;
    is_reserved_seating: boolean;
    show_pick_a_seat: boolean;
    show_seatmap_thumbnail: boolean;
    show_colors_in_seatmap_thumbnail: boolean;
    source: string;
    is_free: boolean;
    version?: string;
    summary: string;
    logo_id?: string;
    organizer_id: string;
    venue_id?: string;
    category_id?: string;
    subcategory_id?: string;
    format_id?: string;
    resource_uri: string;
    is_externally_ticketed: boolean;
    logo?: {
        id: string;
        url: string;
        crop_mask?: any;
        original: {
            url: string;
            width: number;
            height: number;
        };
    };
    venue?: {
        id: string;
        name: string;
        latitude: string;
        longitude: string;
        address: {
            address_1: string;
            address_2?: string;
            city: string;
            region: string;
            postal_code: string;
            country: string;
            localized_address_display: string;
            localized_area_display: string;
            localized_multi_line_address_display: string[];
        };
        resource_uri: string;
    };
    ticket_classes?: Array<{
        id: string;
        name: string;
        description?: string;
        cost: {
            currency: string;
            display: string;
            value: number;
        };
        fee: {
            currency: string;
            display: string;
            value: number;
        };
        tax: {
            currency: string;
            display: string;
            value: number;
        };
        actual_cost: {
            currency: string;
            display: string;
            value: number;
        };
        actual_fee: {
            currency: string;
            display: string;
            value: number;
        };
        quantity_total?: number;
        quantity_sold: number;
        sales_start: string;
        sales_end: string;
        hidden: boolean;
        include_fee: boolean;
        split_fee: boolean;
        hide_description: boolean;
        auto_hide: boolean;
        auto_hide_before: string;
        auto_hide_after: string;
        sales_start_after: string;
        sales_end_before: string;
        minimum_quantity: number;
        maximum_quantity: number;
        order_confirmation_message?: string;
        resource_uri: string;
    }>;
}
export interface EventbriteSearchParams {
    location?: string;
    categories?: string;
    subcategories?: string;
    formats?: string;
    price?: 'free' | 'paid';
    date_created_changed?: string;
    date_modified?: string;
    user_created?: string;
    user_modified?: string;
    name_filter?: string;
    venue_filter?: string;
    organizer_filter?: string;
    user_filter?: string;
    tracking_code?: string;
    include_unavailable_events?: boolean;
    include_restricted_events?: boolean;
    start_date_range_start?: string;
    start_date_range_end?: string;
    end_date_range_start?: string;
    end_date_range_end?: string;
    last_modified_range_start?: string;
    last_modified_range_end?: string;
    event_group_id?: string;
    modified_since?: string;
    only_public?: boolean;
    location_within?: string;
    page?: number;
    order_by?: string;
    sort_by?: string;
    expand?: string;
}
declare class EventbriteService {
    private apiKey;
    private apiSecret;
    private baseUrl;
    constructor();
    private getHeaders;
    /**
     * Search for events in Portland area
     */
    searchEvents(params?: EventbriteSearchParams): Promise<EventbriteEvent[]>;
    /**
     * Get Portland sports events
     */
    getPortlandSportsEvents(): Promise<EventbriteEvent[]>;
    /**
     * Get Portland music events
     */
    getPortlandMusicEvents(): Promise<EventbriteEvent[]>;
    /**
     * Get Portland entertainment events
     */
    getPortlandEntertainmentEvents(): Promise<EventbriteEvent[]>;
    /**
     * Get all Portland events
     */
    getPortlandEvents(): Promise<EventbriteEvent[]>;
    /**
     * Get free events in Portland
     */
    getFreeEvents(): Promise<EventbriteEvent[]>;
    /**
     * Get event details by ID
     */
    getEventDetails(eventId: string): Promise<EventbriteEvent | null>;
    /**
     * Convert Eventbrite event to standardized format
     */
    convertToStandardFormat(event: EventbriteEvent): {
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
        isFree: boolean;
        category: string;
        source: string;
        description: string;
        organizer: string;
        capacity: number | undefined;
        attendeeCount: number;
    };
}
declare const _default: EventbriteService;
export default _default;
