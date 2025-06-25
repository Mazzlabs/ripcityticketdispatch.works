"use strict";
/**
 * MVP Bypass Middleware
 * Handles Stripe, Twilio, and SendGrid bypasses for MVP deployment
 * Routes to mock implementations until service approvals are received
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMVPHeaders = exports.handleMVPSMSConsent = exports.handleMVPSubscriptions = exports.injectMVPServices = exports.mockSendGridService = exports.mockTwilioService = exports.mockStripeService = void 0;
const logger_1 = require("../utils/logger");
// Mock Stripe service for MVP
exports.mockStripeService = {
    createCheckoutSession: async (customerId, priceId, successUrl, cancelUrl) => {
        logger_1.logger.info('MVP: Mock Stripe checkout session created', { customerId, priceId });
        return {
            id: `mock_session_${Date.now()}`,
            url: `${successUrl}?mock=true&message=stripe_approval_pending`
        };
    },
    createBillingPortalSession: async (customerId, returnUrl) => {
        logger_1.logger.info('MVP: Mock Stripe billing portal session created', { customerId });
        return {
            url: `${returnUrl}?mock=true&message=billing_portal_pending_stripe_approval`
        };
    },
    verifyWebhookSignature: (payload, signature) => {
        logger_1.logger.info('MVP: Mock Stripe webhook verification');
        return {
            type: 'mock.event',
            data: { object: { id: 'mock' } }
        };
    },
    createCustomer: async (email, userId) => {
        logger_1.logger.info('MVP: Mock Stripe customer created', { email, userId });
        return {
            id: `mock_cus_${userId}`,
            email
        };
    },
    tiers: {
        free: {
            id: 'free',
            name: 'Free',
            price: 0,
            features: ['Basic deal alerts', 'Email notifications', '5 saved deals'],
            maxAlerts: 5,
            apiAccess: false,
            prioritySupport: false
        },
        pro: {
            id: 'pro',
            name: 'Pro',
            price: 9.99,
            priceId: 'mock_price_pro',
            features: ['SMS alerts', 'Unlimited deals', 'Price history', 'Early access'],
            maxAlerts: -1,
            apiAccess: true,
            prioritySupport: false
        },
        premium: {
            id: 'premium',
            name: 'Premium',
            price: 19.99,
            priceId: 'mock_price_premium',
            features: ['All Pro features', 'Premium venues', 'Deal recommendations', 'Priority support'],
            maxAlerts: -1,
            apiAccess: true,
            prioritySupport: true
        }
    },
    getUsageStats: (customer) => {
        return {
            currentTier: customer.currentTier || 'free',
            alertsUsed: customer.alertsUsed || 0,
            alertsLimit: customer.alertsLimit || 5,
            subscriptionStatus: 'mock_active'
        };
    }
};
// Mock Twilio service for MVP
exports.mockTwilioService = {
    sendSMS: async (to, message) => {
        logger_1.logger.info('MVP: Mock SMS sent', { to: to.replace(/\d(?=\d{4})/g, '*'), message: message.substring(0, 50) + '...' });
        return {
            sid: `mock_sms_${Date.now()}`,
            status: 'delivered',
            to,
            body: message
        };
    },
    validatePhoneNumber: async (phoneNumber) => {
        logger_1.logger.info('MVP: Mock phone validation', { phone: phoneNumber.replace(/\d(?=\d{4})/g, '*') });
        return {
            valid: true,
            formatted: phoneNumber,
            carrier: 'mock_carrier'
        };
    }
};
// Mock SendGrid service for MVP  
exports.mockSendGridService = {
    sendEmail: async (to, subject, content) => {
        logger_1.logger.info('MVP: Mock email sent', { to, subject });
        return {
            messageId: `mock_email_${Date.now()}`,
            status: 'delivered'
        };
    },
    sendWelcomeEmail: async (email, firstName) => {
        logger_1.logger.info('MVP: Mock welcome email sent', { email, firstName });
        return { success: true, messageId: `mock_welcome_${Date.now()}` };
    },
    sendAlertEmail: async (email, deals) => {
        logger_1.logger.info('MVP: Mock alert email sent', { email, dealCount: deals.length });
        return { success: true, messageId: `mock_alert_${Date.now()}` };
    }
};
// Middleware to inject MVP services
const injectMVPServices = (req, res, next) => {
    // Inject mock services into request object for MVP
    req.mvpServices = {
        stripe: exports.mockStripeService,
        twilio: exports.mockTwilioService,
        sendgrid: exports.mockSendGridService
    };
    next();
};
exports.injectMVPServices = injectMVPServices;
// Middleware to handle subscription requests in MVP mode
const handleMVPSubscriptions = (req, res, next) => {
    if (req.headers['x-mvp-mode']) {
        logger_1.logger.info('MVP: Subscription request in MVP mode', { path: req.path, method: req.method });
        // Handle specific subscription endpoints
        if (req.path === '/checkout' && req.method === 'POST') {
            const { tierId } = req.body;
            return res.json({
                success: true,
                url: `${process.env.FRONTEND_URL || 'https://ripcityticketdispatch.works'}/mvp-pending?service=stripe&tier=${tierId}`,
                message: 'MVP Mode: Stripe approval pending',
                sessionId: `mock_session_${Date.now()}`
            });
        }
        if (req.path === '/portal' && req.method === 'POST') {
            return res.json({
                success: true,
                url: `${process.env.FRONTEND_URL || 'https://ripcityticketdispatch.works'}/mvp-pending?service=stripe_portal`,
                message: 'MVP Mode: Billing portal pending Stripe approval'
            });
        }
        if (req.path === '/status' && req.method === 'GET') {
            return res.json({
                success: true,
                subscription: {
                    currentTier: 'free',
                    alertsUsed: 0,
                    alertsLimit: 5,
                    subscriptionStatus: 'mvp_mode',
                    message: 'MVP deployment - Stripe integration pending approval'
                }
            });
        }
        if (req.path === '/tiers' && req.method === 'GET') {
            return res.json({
                success: true,
                tiers: Object.values(exports.mockStripeService.tiers),
                message: 'MVP Mode: Tiers available, payment processing pending Stripe approval'
            });
        }
    }
    next();
};
exports.handleMVPSubscriptions = handleMVPSubscriptions;
// Middleware to handle SMS consent in MVP mode
const handleMVPSMSConsent = (req, res, next) => {
    if (req.headers['x-mvp-mode']) {
        logger_1.logger.info('MVP: SMS consent request in MVP mode', { path: req.path, method: req.method });
        if (req.path === '/opt-in' && req.method === 'POST') {
            const { phoneNumber, subscriptionTier } = req.body;
            return res.json({
                success: true,
                message: 'MVP Mode: SMS consent recorded, Twilio integration pending approval',
                consentId: `mock_consent_${Date.now()}`,
                doubleOptIn: {
                    required: true,
                    code: '123456',
                    note: 'MVP: Mock verification code - Twilio approval pending'
                }
            });
        }
        if (req.path === '/verify' && req.method === 'POST') {
            return res.json({
                success: true,
                message: 'MVP Mode: SMS verification simulated - Twilio approval pending',
                verified: true
            });
        }
        if (req.path === '/opt-out' && req.method === 'POST') {
            return res.json({
                success: true,
                message: 'MVP Mode: SMS opt-out recorded - Twilio approval pending'
            });
        }
    }
    next();
};
exports.handleMVPSMSConsent = handleMVPSMSConsent;
// Middleware to add MVP headers to responses
const addMVPHeaders = (req, res, next) => {
    // Add headers to indicate MVP status
    res.setHeader('X-MVP-Mode', 'true');
    res.setHeader('X-Pending-Approvals', 'stripe,twilio,sendgrid');
    res.setHeader('X-Live-APIs', 'ticketmaster,eventbrite');
    next();
};
exports.addMVPHeaders = addMVPHeaders;
