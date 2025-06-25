"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeService = exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const logger_1 = require("../utils/logger");
class StripeService {
    constructor() {
        // Subscription tiers with Stripe price IDs
        this.tiers = {
            free: {
                id: 'free',
                name: 'Free',
                priceId: '', // No price for free tier
                price: 0,
                features: ['Basic deal alerts', '5 alerts per day', 'Email notifications'],
                maxAlerts: 5,
                apiAccess: false,
                prioritySupport: false
            },
            pro: {
                id: 'pro',
                name: 'Pro',
                priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
                price: 9.99,
                features: ['Real-time alerts', 'Unlimited alerts', 'SMS notifications', 'Advanced filtering'],
                maxAlerts: -1, // Unlimited
                apiAccess: false,
                prioritySupport: false
            },
            premium: {
                id: 'premium',
                name: 'Premium',
                priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_placeholder',
                price: 19.99,
                features: ['All Pro features', 'API access', 'Custom webhooks', 'Historical data'],
                maxAlerts: -1,
                apiAccess: true,
                prioritySupport: true
            },
            enterprise: {
                id: 'enterprise',
                name: 'Enterprise',
                priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_placeholder',
                price: 99.99,
                features: ['All Premium features', 'White-label API', 'Bulk data access', 'Priority support'],
                maxAlerts: -1,
                apiAccess: true,
                prioritySupport: true
            }
        };
        const secretKey = process.env.STRIPE_SECRET;
        if (!secretKey) {
            console.warn('STRIPE_SECRET environment variable not found - Stripe features will be disabled');
            this.stripe = null; // Disable Stripe functionality
            return;
        }
        this.stripe = new stripe_1.default(secretKey, {
            apiVersion: '2023-10-16'
        });
    }
    /**
     * Create a Stripe customer
     */
    async createCustomer(email, userId, name) {
        if (!this.stripe) {
            throw new Error('Stripe not configured - payment features unavailable');
        }
        try {
            const customer = await this.stripe.customers.create({
                email,
                metadata: {
                    userId
                },
                name
            });
            logger_1.logger.info('Created Stripe customer', { customerId: customer.id, userId, email });
            return customer;
        }
        catch (error) {
            logger_1.logger.error('Failed to create Stripe customer', { error, userId, email });
            throw error;
        }
    }
    /**
     * Create a subscription checkout session
     */
    async createCheckoutSession(customerId, priceId, successUrl, cancelUrl) {
        try {
            const session = await this.stripe.checkout.sessions.create({
                customer: customerId,
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1
                    }
                ],
                mode: 'subscription',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    customerId
                }
            });
            logger_1.logger.info('Created checkout session', { sessionId: session.id, customerId, priceId });
            return session;
        }
        catch (error) {
            logger_1.logger.error('Failed to create checkout session', { error, customerId, priceId });
            throw error;
        }
    }
    /**
     * Create a billing portal session for subscription management
     */
    async createBillingPortalSession(customerId, returnUrl) {
        try {
            const session = await this.stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl
            });
            logger_1.logger.info('Created billing portal session', { sessionId: session.id, customerId });
            return session;
        }
        catch (error) {
            logger_1.logger.error('Failed to create billing portal session', { error, customerId });
            throw error;
        }
    }
    /**
     * Get subscription details
     */
    async getSubscription(subscriptionId) {
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            return subscription;
        }
        catch (error) {
            logger_1.logger.error('Failed to retrieve subscription', { error, subscriptionId });
            throw error;
        }
    }
    /**
     * Cancel a subscription
     */
    async cancelSubscription(subscriptionId) {
        try {
            const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
            logger_1.logger.info('Cancelled subscription', { subscriptionId });
            return subscription;
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel subscription', { error, subscriptionId });
            throw error;
        }
    }
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
        }
        try {
            return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch (error) {
            logger_1.logger.error('Failed to verify webhook signature', { error });
            throw error;
        }
    }
    /**
     * Check if user can perform action based on their tier limits
     */
    canPerformAction(customer, action) {
        const tier = this.tiers[customer.currentTier];
        switch (action) {
            case 'send_alert':
                if (tier.maxAlerts === -1)
                    return true; // Unlimited
                return customer.alertsUsed < tier.maxAlerts;
            case 'api_call':
                return tier.apiAccess;
            default:
                return false;
        }
    }
    /**
     * Get usage statistics for a customer
     */
    getUsageStats(customer) {
        const tier = this.tiers[customer.currentTier];
        return {
            currentTier: customer.currentTier,
            tierName: tier.name,
            alertsUsed: customer.alertsUsed,
            alertsLimit: tier.maxAlerts === -1 ? 'Unlimited' : tier.maxAlerts,
            alertsRemaining: tier.maxAlerts === -1 ? 'Unlimited' : Math.max(0, tier.maxAlerts - customer.alertsUsed),
            apiAccess: tier.apiAccess,
            prioritySupport: tier.prioritySupport,
            subscriptionStatus: customer.subscriptionStatus
        };
    }
}
exports.StripeService = StripeService;
exports.stripeService = new StripeService();
