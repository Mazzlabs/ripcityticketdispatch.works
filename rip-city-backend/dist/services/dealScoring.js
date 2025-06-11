"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealScoringService = void 0;
class DealScoringService {
    constructor() {
        this.HOT_DEAL_THRESHOLD = 85;
        this.WARM_DEAL_THRESHOLD = 70;
        this.GOOD_DEAL_THRESHOLD = 55;
    }
    /**
     * Score a potential deal from Ticketmaster event data
     */
    scoreDeal(event, criteria) {
        if (!event.priceRanges || event.priceRanges.length === 0) {
            return null; // Can't score without price data
        }
        const priceRange = event.priceRanges[0];
        const currentPrice = priceRange.min;
        // For now, estimate "original price" as 20% higher than current
        // In production, we'd have historical data
        const originalPrice = currentPrice * 1.2;
        const savings = originalPrice - currentPrice;
        const savingsPercentage = (savings / originalPrice) * 100;
        // Don't consider it a deal if savings are too low
        if (savingsPercentage < criteria.minSavingsPercentage) {
            return null;
        }
        const dealScore = this.calculateDealScore({
            savingsPercentage,
            currentPrice,
            venuePopularity: criteria.venuePopularity,
            eventPopularity: criteria.eventPopularity,
            timeUntilEvent: criteria.timeUntilEvent,
            maxPriceThreshold: criteria.maxPriceThreshold,
        });
        const confidence = this.calculateConfidence(savingsPercentage, criteria);
        const venue = event._embedded?.venues?.[0];
        const classification = event.classifications?.[0];
        return {
            id: `${event.id}-${Date.now()}`,
            eventId: event.id,
            eventName: event.name,
            venue: venue?.name || 'Unknown Venue',
            date: event.dates.start.localDate,
            time: event.dates.start.localTime || 'TBA',
            originalPrice,
            currentPrice,
            savings,
            savingsPercentage,
            dealScore,
            confidence,
            platform: 'ticketmaster',
            section: 'General Admission', // Would need seat-level data for specifics
            row: '',
            seatCount: 2, // Default assumption
            category: this.categorizeEvent(classification?.segment?.name),
            alertLevel: this.getAlertLevel(dealScore),
            tags: this.generateTags(event, savingsPercentage),
            url: event.url,
            imageUrl: event.images?.find(img => img.ratio === '16_9')?.url,
            lastUpdated: new Date(),
        };
    }
    /**
     * Score multiple events and return all viable deals
     */
    scoreDeals(events, criteria) {
        const defaultCriteria = {
            minSavingsPercentage: 10,
            maxPriceThreshold: 500,
            venuePopularity: 7,
            eventPopularity: 5,
            timeUntilEvent: 30,
            ...criteria
        };
        const deals = [];
        for (const event of events) {
            try {
                const deal = this.scoreDeal(event, defaultCriteria);
                if (deal) {
                    deals.push(deal);
                }
            }
            catch (error) {
                console.warn(`Failed to score event ${event.id}:`, error);
                // Continue processing other events
            }
        }
        // Sort by deal score (highest first)
        return this.sortDeals(deals, 'score');
    }
    calculateDealScore(params) {
        let score = 0;
        // Savings percentage (40% of score)
        score += Math.min(params.savingsPercentage * 2, 40);
        // Venue popularity (20% of score)
        score += (params.venuePopularity / 10) * 20;
        // Event popularity (20% of score)
        score += (params.eventPopularity / 10) * 20;
        // Time sensitivity bonus (10% of score)
        if (params.timeUntilEvent <= 7) {
            score += 10; // Last minute deals
        }
        else if (params.timeUntilEvent <= 30) {
            score += 5; // Upcoming events
        }
        // Price reasonableness (10% of score)
        if (params.maxPriceThreshold && params.currentPrice <= params.maxPriceThreshold) {
            score += 10;
        }
        else if (!params.maxPriceThreshold) {
            score += 5; // No threshold set, give partial credit
        }
        return Math.min(Math.round(score), 100);
    }
    calculateConfidence(savingsPercentage, criteria) {
        let confidence = 50; // Base confidence
        // Higher savings = higher confidence
        if (savingsPercentage >= 30)
            confidence += 30;
        else if (savingsPercentage >= 20)
            confidence += 20;
        else if (savingsPercentage >= 15)
            confidence += 15;
        else
            confidence += savingsPercentage;
        // Historical data increases confidence
        if (criteria.historicalPricing) {
            confidence += 20;
        }
        return Math.min(Math.round(confidence), 100);
    }
    categorizeEvent(segmentName) {
        if (!segmentName)
            return 'other';
        const segment = segmentName.toLowerCase();
        if (segment.includes('sport'))
            return 'sports';
        if (segment.includes('music') || segment.includes('concert'))
            return 'music';
        if (segment.includes('theatre') || segment.includes('theater'))
            return 'theater';
        if (segment.includes('family') || segment.includes('kids'))
            return 'family';
        return 'other';
    }
    getAlertLevel(dealScore) {
        if (dealScore >= this.HOT_DEAL_THRESHOLD)
            return 'hot';
        if (dealScore >= this.WARM_DEAL_THRESHOLD)
            return 'warm';
        if (dealScore >= this.GOOD_DEAL_THRESHOLD)
            return 'good';
        return 'normal';
    }
    generateTags(event, savingsPercentage) {
        const tags = [];
        // Savings-based tags
        if (savingsPercentage >= 30)
            tags.push('HUGE SAVINGS');
        else if (savingsPercentage >= 20)
            tags.push('GREAT DEAL');
        else if (savingsPercentage >= 15)
            tags.push('GOOD DEAL');
        // Event-based tags
        const eventName = event.name.toLowerCase();
        if (eventName.includes('trail blazers') || eventName.includes('blazers')) {
            tags.push('RIP CITY');
        }
        if (eventName.includes('timbers')) {
            tags.push('RCTID');
        }
        if (eventName.includes('playoff') || eventName.includes('championship')) {
            tags.push('PLAYOFFS');
        }
        // Venue-based tags
        const venue = event._embedded?.venues?.[0]?.name?.toLowerCase();
        if (venue?.includes('moda center'))
            tags.push('MODA CENTER');
        if (venue?.includes('providence park'))
            tags.push('PROVIDENCE PARK');
        // Time-based tags
        const eventDate = new Date(event.dates.start.dateTime || event.dates.start.localDate);
        const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 3)
            tags.push('LAST MINUTE');
        else if (daysUntil <= 7)
            tags.push('THIS WEEK');
        return tags;
    }
    /**
     * Filter deals based on user preferences
     */
    filterDeals(deals, filters) {
        return deals.filter(deal => {
            if (filters.categories && !filters.categories.includes(deal.category)) {
                return false;
            }
            if (filters.maxPrice && deal.currentPrice > filters.maxPrice) {
                return false;
            }
            if (filters.minSavings && deal.savingsPercentage < filters.minSavings) {
                return false;
            }
            if (filters.venues && !filters.venues.some(venue => deal.venue.toLowerCase().includes(venue.toLowerCase()))) {
                return false;
            }
            if (filters.alertLevels && !filters.alertLevels.includes(deal.alertLevel)) {
                return false;
            }
            return true;
        });
    }
    /**
     * Sort deals by relevance/score
     */
    sortDeals(deals, sortBy = 'score') {
        return [...deals].sort((a, b) => {
            switch (sortBy) {
                case 'score':
                    return b.dealScore - a.dealScore;
                case 'savings':
                    return b.savingsPercentage - a.savingsPercentage;
                case 'price':
                    return a.currentPrice - b.currentPrice;
                case 'date':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                default:
                    return b.dealScore - a.dealScore;
            }
        });
    }
}
exports.DealScoringService = DealScoringService;
//# sourceMappingURL=dealScoring.js.map