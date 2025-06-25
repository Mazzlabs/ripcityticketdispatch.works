export interface Alert {
    id: string;
    userId: string;
    dealId: string;
    venue: string;
    originalPrice: number;
    currentPrice: number;
    savings: number;
    savingsPercentage: number;
    alertLevel: 'hot' | 'warm' | 'good' | 'normal';
    sentAt: Date;
    method: 'email' | 'sms' | 'webhook';
}
export interface AlertPreferences {
    userId: string;
    email?: string;
    phone?: string;
    webhook?: string;
    minSavingsPercentage: number;
    alertMethods: Array<'email' | 'sms' | 'webhook'>;
    maxAlertsPerDay: number;
    categories: string[];
    venues: string[];
}
declare class MonetizedAlertService {
    private emailTransporter;
    private twilioClient;
    constructor();
    /**
     * Send an alert to a user (enforces subscription limits)
     */
    sendAlert(userId: string, deal: any, preferences: AlertPreferences): Promise<Alert[]>;
    private getDailyAlertLimit;
    private getAlertLevel;
    private getTodayAlertCount;
    private sendEmailAlert;
    private sendSMSAlert;
    private sendWebhookAlert;
    /**
     * Get user's alert preferences
     */
    getAlertPreferences(userId: string): Promise<AlertPreferences | null>;
    /**
     * Update user's alert preferences
     */
    updateAlertPreferences(userId: string, preferences: Partial<AlertPreferences>): Promise<void>;
}
export declare const monetizedAlertService: MonetizedAlertService;
export default monetizedAlertService;
