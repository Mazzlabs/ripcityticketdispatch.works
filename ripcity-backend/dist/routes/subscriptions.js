"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const express_1 = __importDefault(require("express"));
const mvpBypass_1 = require("../services/mvpBypass");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
function default_1(stripeService) {
    const router = express_1.default.Router();
    /**
     * GET /subscriptions/tiers
     * Get available subscription tiers
     */
    router.get('/tiers', (req, res) => {
        try {
            const tiers = Object.values(stripeService.tiers).map(tier => ({
                id: tier.id,
                name: tier.name,
                price: tier.price,
                features: tier.features,
                maxAlerts: tier.maxAlerts === -1 ? 'Unlimited' : tier.maxAlerts,
                apiAccess: tier.apiAccess,
                prioritySupport: tier.prioritySupport
            }));
            res.json({
                success: true,
                tiers,
                mvp_mode: stripeService === mvpBypass_1.mockStripeService,
                stripe_status: stripeService === mvpBypass_1.mockStripeService ? 'bypassed_for_mvp' : 'live'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get subscription tiers', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to get subscription tiers'
            });
        }
    });
    /**
     * POST /subscriptions/checkout
     * Create checkout session for subscription
     */
    router.post('/checkout', auth_1.authenticateToken, async (req, res) => {
        try {
            const { tierId } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }
            if (!tierId || !(tierId in stripeService.tiers)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid tier ID'
                });
            }
            const tier = stripeService.tiers[tierId];
            if (tier.id === 'free') {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot create checkout for free tier'
                });
            }
            // TODO: Get user email from database
            const userEmail = req.user?.email || 'user@example.com';
            // Create or get customer
            let customer;
            try {
                customer = await stripeService.createCustomer(userEmail, userId);
            }
            catch (error) {
                logger_1.logger.warn('Customer creation may be handled by mock service', { userId, error });
            }
            const successUrl = `${process.env.FRONTEND_URL || 'https://ripcityticketdispatch.works'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
            const cancelUrl = `${process.env.FRONTEND_URL || 'https://ripcityticketdispatch.works'}/subscription/cancel`;
            const session = await stripeService.createCheckoutSession(customer?.id || `cus_${userId}`, tier.priceId || 'mock_price_id', successUrl, cancelUrl);
            res.json({
                success: true,
                sessionId: session.id,
                sessionUrl: session.url,
                mvp_mode: stripeService === mvpBypass_1.mockStripeService
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create checkout session', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to create checkout session'
            });
        }
    });
    /**
     * POST /subscriptions/portal
     * Create billing portal session
     */
    router.post('/portal', auth_1.authenticateToken, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }
            // TODO: Get customer's Stripe ID from database
            const stripeCustomerId = `cus_${userId}`; // This should come from your database
            const returnUrl = `${process.env.FRONTEND_URL || 'https://ripcityticketdispatch.works'}/dashboard`;
            const session = await stripeService.createBillingPortalSession(stripeCustomerId, returnUrl);
            res.json({
                success: true,
                url: session.url
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create billing portal session', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to create billing portal session'
            });
        }
    });
    /**
     * GET /subscriptions/status
     * Get user's current subscription status
     */
    router.get('/status', auth_1.authenticateToken, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }
            // TODO: Get customer data from database
            const mockCustomer = {
                id: userId,
                userId,
                stripeCustomerId: `cus_${userId}`,
                email: req.user?.email || 'user@example.com',
                currentTier: 'free',
                alertsUsed: 0,
                alertsLimit: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const usageStats = stripeService.getUsageStats(mockCustomer);
            res.json({
                success: true,
                subscription: usageStats
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get subscription status', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to get subscription status'
            });
        }
    });
    /**
     * POST /subscriptions/webhook
     * Webhook for Stripe events
     */
    router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
        const sig = req.headers['stripe-signature'];
        if (!sig) {
            return res.status(400).send('Webhook Error: No signature');
        }
        try {
            const event = stripeService.verifyWebhookSignature(req.body, sig);
            // TODO: Handle event (e.g., update user subscription status)
            logger_1.logger.info('Stripe webhook event received', { event });
            res.json({ received: true });
        }
        catch (err) {
            logger_1.logger.error('Stripe webhook error', { error: err.message });
            res.status(400).send(`Webhook Error: ${err.message}`);
        }
    });
    return router;
}
