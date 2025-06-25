/**
 * RIP CITY TICKET DISPATCH - SMS Consent Service
 * TCPA Compliant SMS Opt-in/Opt-out Management
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */
interface SMSConsentData {
    userId: string;
    phoneNumber: string;
    subscriptionTier: string;
    ipAddress?: string;
    userAgent?: string;
    source?: string;
}
interface SMSConsentRecord {
    id: string;
    userId: string;
    phoneNumber: string;
    consentTimestamp: Date;
    optOutTimestamp?: Date;
    subscriptionTier: string;
    doubleOptInConfirmed: boolean;
    doubleOptInConfirmedAt?: Date;
    createdAt: Date;
}
declare class SMSConsentService {
    private twilioClient;
    private mvpMode;
    constructor();
    /**
     * Format and validate phone number
     */
    private formatPhoneNumber;
    /**
     * Validate phone number is mobile (for SMS)
     */
    private validateMobileNumber;
    /**
     * Create SMS consent record and send double opt-in
     */
    createSMSConsent(data: SMSConsentData): Promise<{
        success: boolean;
        doubleOptInCode?: string;
        error?: string;
    }>;
    /**
     * Confirm double opt-in
     */
    confirmSMSConsent(userId: string, phoneNumber: string, confirmationCode: string): Promise<boolean>;
    /**
     * Process opt-out (STOP keyword)
     */
    processOptOut(phoneNumber: string): Promise<boolean>;
    /**
     * Get user's SMS consent status
     */
    getSMSConsentStatus(userId: string): Promise<SMSConsentRecord | null>;
    /**
     * Check if user can receive SMS alerts
     */
    canReceiveSMS(userId: string): Promise<boolean>;
    /**
     * Check if phone number is opted out
     */
    isPhoneOptedOut(phoneNumber: string): Promise<boolean>;
    /**
     * Handle incoming SMS webhook from Twilio
     */
    handleIncomingSMS(from: string, body: string): Promise<{
        success: boolean;
        response?: string;
    }>;
    /**
     * Get SMS consent audit report
     */
    getConsentAuditReport(startDate?: Date, endDate?: Date): Promise<any[]>;
}
export declare const smsConsentService: SMSConsentService;
export default smsConsentService;
