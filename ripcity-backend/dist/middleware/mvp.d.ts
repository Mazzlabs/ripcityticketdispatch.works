/**
 * MVP Bypass Middleware
 * Handles Stripe, Twilio, and SendGrid bypasses for MVP deployment
 * Routes to mock implementations until service approvals are received
 */
import { Request, Response, NextFunction } from 'express';
export declare const mockStripeService: {
    createCheckoutSession: (customerId: string, priceId: string, successUrl: string, cancelUrl: string) => Promise<{
        id: string;
        url: string;
    }>;
    createBillingPortalSession: (customerId: string, returnUrl: string) => Promise<{
        url: string;
    }>;
    verifyWebhookSignature: (payload: string, signature: string) => {
        type: string;
        data: {
            object: {
                id: string;
            };
        };
    };
    createCustomer: (email: string, userId: string) => Promise<{
        id: string;
        email: string;
    }>;
    tiers: {
        free: {
            id: string;
            name: string;
            price: number;
            features: string[];
            maxAlerts: number;
            apiAccess: boolean;
            prioritySupport: boolean;
        };
        pro: {
            id: string;
            name: string;
            price: number;
            priceId: string;
            features: string[];
            maxAlerts: number;
            apiAccess: boolean;
            prioritySupport: boolean;
        };
        premium: {
            id: string;
            name: string;
            price: number;
            priceId: string;
            features: string[];
            maxAlerts: number;
            apiAccess: boolean;
            prioritySupport: boolean;
        };
    };
    getUsageStats: (customer: any) => {
        currentTier: any;
        alertsUsed: any;
        alertsLimit: any;
        subscriptionStatus: string;
    };
};
export declare const mockTwilioService: {
    sendSMS: (to: string, message: string) => Promise<{
        sid: string;
        status: string;
        to: string;
        body: string;
    }>;
    validatePhoneNumber: (phoneNumber: string) => Promise<{
        valid: boolean;
        formatted: string;
        carrier: string;
    }>;
};
export declare const mockSendGridService: {
    sendEmail: (to: string, subject: string, content: string) => Promise<{
        messageId: string;
        status: string;
    }>;
    sendWelcomeEmail: (email: string, firstName: string) => Promise<{
        success: boolean;
        messageId: string;
    }>;
    sendAlertEmail: (email: string, deals: any[]) => Promise<{
        success: boolean;
        messageId: string;
    }>;
};
export declare const injectMVPServices: (req: Request, res: Response, next: NextFunction) => void;
export declare const handleMVPSubscriptions: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const handleMVPSMSConsent: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const addMVPHeaders: (req: Request, res: Response, next: NextFunction) => void;
