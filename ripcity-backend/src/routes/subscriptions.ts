import express from 'express';
import { stripeService } from '../services/stripeService';
import { mockStripeService, mvpStatus } from '../services/mvpBypass';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /subscriptions/tiers
 * Get available subscription tiers
 */
router.get('/tiers', (req, res) => {
  try {
    // Use mock service for MVP
    const activeService = mvpStatus.stripe.enabled ? stripeService : mockStripeService;
    const tiers = Object.values(activeService.tiers).map(tier => ({
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
      mvp_mode: !mvpStatus.stripe.enabled,
      stripe_status: mvpStatus.stripe.reason
    });
  } catch (error) {
    logger.error('Failed to get subscription tiers', { error });
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
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const { tierId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Use mock service for MVP
    const activeService = mvpStatus.stripe.enabled ? stripeService : mockStripeService;
    
    if (!tierId || !(tierId in activeService.tiers)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier ID'
      });
    }

    const tier = (activeService.tiers as any)[tierId];
    
    if (tier.id === 'free') {
      return res.status(400).json({
        success: false,
        error: 'Cannot create checkout for free tier'
      });
    }

    // TODO: Get user email from database
    const userEmail = req.user?.email || 'user@example.com';
    
    // Create or get customer (mock for MVP)
    let customer;
    try {
      customer = await activeService.createCustomer(userEmail, userId);
    } catch (error) {
      logger.warn('Customer creation handled by mock service', { userId, error });
    }

    const successUrl = `${process.env.FRONTEND_URL || 'https://ripcityticketdispatch.works'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'https://ripcityticketdispatch.works'}/subscription/cancel`;

    const session = await activeService.createCheckoutSession(
      customer?.id || `cus_${userId}`,
      tier.priceId || 'mock_price_id',
      successUrl,
      cancelUrl
    );

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      mvp_mode: !mvpStatus.stripe.enabled,
      note: mvpStatus.stripe.enabled ? undefined : 'Mock checkout session - Stripe approval pending'
    });

  } catch (error) {
    logger.error('Failed to create checkout session', { error });
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
router.post('/portal', authenticateToken, async (req, res) => {
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

  } catch (error) {
    logger.error('Failed to create billing portal session', { error });
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
router.get('/status', authenticateToken, async (req, res) => {
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
      currentTier: 'free' as const,
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

  } catch (error) {
    logger.error('Failed to get subscription status', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription status'
    });
  }
});

/**
 * POST /subscriptions/webhook
 * Handle Stripe webhooks
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing stripe signature'
      });
    }

    const event = stripeService.verifyWebhookSignature(req.body, signature);
    
    logger.info('Received Stripe webhook', { type: event.type, id: event.id });

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any;
        logger.info('Checkout session completed', { sessionId: session.id, customerId: session.customer });
        // TODO: Update user's subscription in database
        break;

      case 'customer.subscription.created':
        const createdSub = event.data.object as any;
        logger.info('Subscription created', { subscriptionId: createdSub.id, customerId: createdSub.customer });
        // TODO: Update user's subscription status in database
        break;

      case 'customer.subscription.updated':
        const updatedSub = event.data.object as any;
        logger.info('Subscription updated', { subscriptionId: updatedSub.id, status: updatedSub.status });
        // TODO: Update user's subscription status in database
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as any;
        logger.info('Subscription cancelled', { subscriptionId: deletedSub.id });
        // TODO: Downgrade user to free tier in database
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as any;
        logger.warn('Payment failed', { invoiceId: failedInvoice.id, customerId: failedInvoice.customer });
        // TODO: Handle failed payment (send email, update status)
        break;

      default:
        logger.info('Unhandled webhook event', { type: event.type });
    }

    res.json({ success: true });

  } catch (error) {
    logger.error('Webhook processing failed', { error });
    res.status(400).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

export default router;
