/**
 * MVP Service Bypasses - Mock implementations for pending API approvals
 * These services provide mock responses until Twilio, Stripe, and SendGrid are approved
 */
export declare const mockStripeService: {
    createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string): Promise<{
        id: string;
        url: string;
        object: string;
        status: string;
    }>;
    createBillingPortalSession(customerId: string, returnUrl: string): Promise<{
        id: string;
        url: string;
        object: string;
    }>;
    createCustomer(email: string, userId: string): Promise<{
        id: string;
        email: string;
        object: string;
        created: number;
    }>;
    verifyWebhookSignature(payload: any, signature: string): {
        id: string;
        type: string;
        data: {
            object: {
                id: string;
                customer: string;
            };
        };
    };
    tiers: {
        free: {
            id: string;
            name: string;
            price: number;
            features: string[];
            maxAlerts: number;
            apiAccess: boolean;
            prioritySupport: boolean;
            priceId: null;
        };
        pro: {
            id: string;
            name: string;
            price: number;
            features: string[];
            maxAlerts: number;
            apiAccess: boolean;
            prioritySupport: boolean;
            priceId: string;
        };
        premium: {
            id: string;
            name: string;
            price: number;
            features: string[];
            maxAlerts: number;
            apiAccess: boolean;
            prioritySupport: boolean;
            priceId: string;
        };
        enterprise: {
            id: string;
            name: string;
            price: number;
            features: string[];
            maxAlerts: number;
            apiAccess: boolean;
            prioritySupport: boolean;
            priceId: string;
        };
    };
    getUsageStats(customer: any): {
        currentTier: any;
        alertsUsed: any;
        alertsLimit: any;
        subscriptionStatus: string;
        billingPeriodEnd: string;
    };
};
export declare const mockTwilioService: {
    sendSMS(to: string, message: string): Promise<{
        sid: string;
        status: string;
    }>;
    validatePhoneNumber(phoneNumber: string): boolean;
    sendDoubleOptIn(phoneNumber: string, code: string): Promise<{
        sid: string;
        status: string;
    }>;
};
export declare const mockSmsConsentService: {
    createSMSConsent(data: any): Promise<{
        success: boolean;
        doubleOptInCode?: string;
        error?: string;
    }>;
    confirmSMSConsent(userId: string, phoneNumber: string, confirmationCode: string): Promise<boolean>;
    getSMSConsentStatus(userId: string): Promise<any | null>;
    optOut(userId: string): Promise<boolean>;
    sendVerificationText(to: string, message: string): Promise<{
        sid: string;
        status: string;
    }>;
};
export declare const mockSendGridService: {
    sendEmail(to: string, subject: string, html: string): Promise<{
        messageId: string;
    }>;
};
export declare const mvpStatus: {
    stripe: {
        enabled: boolean;
        reason: string;
        mockImplementation: boolean;
    };
    twilio: {
        enabled: boolean;
        reason: string;
        mockImplementation: boolean;
    };
    sendgrid: {
        enabled: boolean;
        reason: string;
        mockImplementation: boolean;
    };
    ticketmaster: {
        enabled: boolean;
        reason: string;
        mockImplementation: boolean;
    };
    eventbrite: {
        enabled: boolean;
        reason: string;
        mockImplementation: boolean;
    };
};
declare const _default: {
    mockStripeService: {
        createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string): Promise<{
            id: string;
            url: string;
            object: string;
            status: string;
        }>;
        createBillingPortalSession(customerId: string, returnUrl: string): Promise<{
            id: string;
            url: string;
            object: string;
        }>;
        createCustomer(email: string, userId: string): Promise<{
            id: string;
            email: string;
            object: string;
            created: number;
        }>;
        verifyWebhookSignature(payload: any, signature: string): {
            id: string;
            type: string;
            data: {
                object: {
                    id: string;
                    customer: string;
                };
            };
        };
        tiers: {
            free: {
                id: string;
                name: string;
                price: number;
                features: string[];
                maxAlerts: number;
                apiAccess: boolean;
                prioritySupport: boolean;
                priceId: null;
            };
            pro: {
                id: string;
                name: string;
                price: number;
                features: string[];
                maxAlerts: number;
                apiAccess: boolean;
                prioritySupport: boolean;
                priceId: string;
            };
            premium: {
                id: string;
                name: string;
                price: number;
                features: string[];
                maxAlerts: number;
                apiAccess: boolean;
                prioritySupport: boolean;
                priceId: string;
            };
            enterprise: {
                id: string;
                name: string;
                price: number;
                features: string[];
                maxAlerts: number;
                apiAccess: boolean;
                prioritySupport: boolean;
                priceId: string;
            };
        };
        getUsageStats(customer: any): {
            currentTier: any;
            alertsUsed: any;
            alertsLimit: any;
            subscriptionStatus: string;
            billingPeriodEnd: string;
        };
    };
    mockTwilioService: {
        sendSMS(to: string, message: string): Promise<{
            sid: string;
            status: string;
        }>;
        validatePhoneNumber(phoneNumber: string): boolean;
        sendDoubleOptIn(phoneNumber: string, code: string): Promise<{
            sid: string;
            status: string;
        }>;
    };
    mockSendGridService: {
        sendEmail(to: string, subject: string, html: string): Promise<{
            messageId: string;
        }>;
    };
    mvpStatus: {
        stripe: {
            enabled: boolean;
            reason: string;
            mockImplementation: boolean;
        };
        twilio: {
            enabled: boolean;
            reason: string;
            mockImplementation: boolean;
        };
        sendgrid: {
            enabled: boolean;
            reason: string;
            mockImplementation: boolean;
        };
        ticketmaster: {
            enabled: boolean;
            reason: string;
            mockImplementation: boolean;
        };
        eventbrite: {
            enabled: boolean;
            reason: string;
            mockImplementation: boolean;
        };
    };
};
export default _default;
