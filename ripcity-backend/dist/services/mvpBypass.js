"use strict";
/**
 * MVP Service Bypasses - Mock implementations for pending API approvals
 * These services provide mock responses until Twilio, Stripe, and SendGrid are approved
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mvpStatus = exports.mockSendGridService = exports.mockSmsConsentService = exports.mockTwilioService = exports.mockStripeService = void 0;
// Mock Stripe Service for MVP
exports.mockStripeService = {
    async createCheckoutSession(customerId, priceId, successUrl, cancelUrl) {
        return {
            id: `cs_mock_${Date.now()}`,
            url: `${successUrl}?mock=true&message=stripe_pending_approval`,
            object: 'checkout.session',
            status: 'mock_pending_approval'
        };
    },
    async createBillingPortalSession(customerId, returnUrl) {
        return {
            id: `bps_mock_${Date.now()}`,
            url: `${returnUrl}?mock=true&message=billing_pending_approval`,
            object: 'billing_portal.session'
        };
    },
    async createCustomer(email, userId) {
        return {
            id: `cus_mock_${userId}`,
            email,
            object: 'customer',
            created: Math.floor(Date.now() / 1000)
        };
    },
    verifyWebhookSignature(payload, signature) {
        // Mock webhook event for testing
        return {
            id: `evt_mock_${Date.now()}`,
            type: 'checkout.session.completed',
            data: { object: { id: 'cs_mock', customer: 'cus_mock' } }
        };
    },
    tiers: {
        free: {
            id: 'free',
            name: 'Free',
            price: 0,
            features: ['Basic event notifications', 'Email alerts', 'Web dashboard'],
            maxAlerts: 5,
            apiAccess: false,
            prioritySupport: false,
            priceId: null
        },
        pro: {
            id: 'pro',
            name: 'Pro',
            price: 9.99,
            features: ['SMS alerts', 'Priority notifications', 'Advanced filtering', 'Price tracking'],
            maxAlerts: 100,
            apiAccess: false,
            prioritySupport: false,
            priceId: 'price_pro_monthly'
        },
        premium: {
            id: 'premium',
            name: 'Premium',
            price: 19.99,
            features: ['All Pro features', 'API access', 'Custom alerts', 'Pre-sale access'],
            maxAlerts: 500,
            apiAccess: true,
            prioritySupport: true,
            priceId: 'price_premium_monthly'
        },
        enterprise: {
            id: 'enterprise',
            name: 'Enterprise',
            price: 49.99,
            features: ['All Premium features', 'Unlimited alerts', 'Priority support', 'Custom integrations'],
            maxAlerts: -1,
            apiAccess: true,
            prioritySupport: true,
            priceId: 'price_enterprise_monthly'
        }
    },
    getUsageStats(customer) {
        return {
            currentTier: customer.currentTier || 'free',
            alertsUsed: customer.alertsUsed || 0,
            alertsLimit: customer.alertsLimit || 5,
            subscriptionStatus: 'mock_active',
            billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
    }
};
// Mock Twilio Service for MVP
exports.mockTwilioService = {
    async sendSMS(to, message) {
        console.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
        return { sid: `SM_mock_${Date.now()}`, status: 'mock_sent' };
    },
    validatePhoneNumber(phoneNumber) {
        console.log(`[MOCK TWILIO] Validating phone number: ${phoneNumber}`);
        // Basic phone number validation for US numbers
        const phoneRegex = /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
        return phoneRegex.test(phoneNumber.replace(/\D/g, ''));
    },
    async sendDoubleOptIn(phoneNumber, code) {
        console.log(`[MOCK SMS] Double opt-in to: ${phoneNumber}, Code: ${code}`);
        return { sid: `SM_optin_mock_${Date.now()}`, status: 'mock_sent' };
    }
};
// Mock SMS Consent Service for MVP
exports.mockSmsConsentService = {
    async createSMSConsent(data) {
        console.log(`[MOCK SMS CONSENT] Creating consent for ${data.phoneNumber}`);
        return { success: true, doubleOptInCode: '123456' };
    },
    async confirmSMSConsent(userId, phoneNumber, confirmationCode) {
        console.log(`[MOCK SMS CONSENT] Confirming consent for ${phoneNumber}`);
        return true;
    },
    async getSMSConsentStatus(userId) {
        console.log(`[MOCK SMS CONSENT] Getting status for ${userId}`);
        return {
            id: `mock_${userId}`,
            userId,
            phoneNumber: '555-555-5555',
            consentTimestamp: new Date(),
            subscriptionTier: 'pro',
            doubleOptInConfirmed: true,
            doubleOptInConfirmedAt: new Date(),
            createdAt: new Date(),
        };
    },
    async optOut(userId) {
        console.log(`[MOCK SMS CONSENT] Opting out ${userId}`);
        return true;
    },
    async sendVerificationText(to, message) {
        console.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
        return { sid: `SM_mock_${Date.now()}`, status: 'mock_sent' };
    }
};
// Mock SendGrid Service for MVP
exports.mockSendGridService = {
    async sendEmail(to, subject, html) {
        console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
        return { messageId: `msg_mock_${Date.now()}` };
    }
};
// Determine MVP status based on environment variables
exports.mvpStatus = {
    stripe: {
        enabled: false,
        reason: 'Pending merchant approval',
        mockImplementation: true
    },
    twilio: {
        enabled: false,
        reason: 'Pending SMS service approval',
        mockImplementation: true
    },
    sendgrid: {
        enabled: false,
        reason: 'Pending email service approval',
        mockImplementation: true
    },
    ticketmaster: {
        enabled: true,
        reason: 'Certified API credentials active',
        mockImplementation: false
    },
    eventbrite: {
        enabled: true,
        reason: 'Certified API credentials active',
        mockImplementation: false
    }
};
exports.default = {
    mockStripeService: exports.mockStripeService,
    mockTwilioService: exports.mockTwilioService,
    mockSendGridService: exports.mockSendGridService,
    mvpStatus: exports.mvpStatus
};
