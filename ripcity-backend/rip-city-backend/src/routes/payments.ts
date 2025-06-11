import express from 'express';
import { stripeService } from '../services/stripeService';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all available subscription plans
router.get('/plans', (req, res) => {
  try {
    const plans = Object.values(stripeService.tiers);
    res.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        features: plan.features,
        maxAlerts: plan.maxAlerts === -1 ? 'Unlimited' : plan.maxAlerts,
        apiAccess: plan.apiAccess,
        prioritySupport: plan.prioritySupport
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription plans'
    });
  }
});

// Create checkout session for subscription
router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { planId } = req.body;
    const user = req.user;

    if (!planId || !stripeService.tiers[planId]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
      });
    }

    const plan = stripeService.tiers[planId];
    
    // Skip checkout for free plan
    if (planId === 'free') {
      return res.json({
        success: true,
        message: 'Free plan activated',
        redirectUrl: '/dashboard'
      });
    }

    // Create or get Stripe customer
    let customer;
    try {
      customer = await stripeService.createCustomer(user.email, user.id, user.name);
    } catch (error) {
      // Customer might already exist
      console.log('Customer creation failed, might already exist');
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession(
      customer?.id || `temp_${user.id}`,
      plan.priceId,
      `${process.env.FRONTEND_URL || 'https://ripcityticketdispatch.works'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      `${process.env.FRONTEND_URL || 'https://ripcityticketdispatch.works'}/pricing?canceled=true`
    );

    res.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    });
  }
});

// Create billing portal session
router.post('/billing-portal', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    // You would need to get the customer ID from your database
    // For now, we'll create a placeholder
    const customerId = `cus_${user.id}`; // This should come from your database
    
    const session = await stripeService.createBillingPortalSession(
      customerId,
      `${process.env.FRONTEND_URL || 'https://ripcityticketdispatch.works'}/dashboard`
    );

    res.json({
      success: true,
      billingPortalUrl: session.url
    });

  } catch (error) {
    console.error('Billing portal creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create billing portal session'
    });
  }
});

// Handle Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe signature' });
  }

  try {
    const event = stripeService.verifyWebhookSignature(
      req.body.toString(),
      signature as string
    );

    console.log('💰 Stripe webhook received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any;
        console.log('🎉 New subscription completed!', {
          customerEmail: session.customer_details?.email,
          subscriptionId: session.subscription,
          amountTotal: session.amount_total / 100 // Convert from cents
        });
        
        // TODO: Update user subscription in your database
        // await updateUserSubscription(session.customer, session.subscription, 'active');
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as any;
        console.log('✅ Payment succeeded!', {
          subscriptionId: invoice.subscription,
          amountPaid: invoice.amount_paid / 100
        });
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as any;
        console.log('❌ Payment failed!', {
          subscriptionId: failedInvoice.subscription,
          customerEmail: failedInvoice.customer_email
        });
        // TODO: Update user subscription status to 'past_due'
        break;

      case 'customer.subscription.deleted':
        const canceledSub = event.data.object as any;
        console.log('🚫 Subscription canceled!', {
          subscriptionId: canceledSub.id,
          customerId: canceledSub.customer
        });
        // TODO: Update user subscription status to 'canceled'
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

// Get user's current subscription status
router.get('/subscription-status', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    // TODO: Get this from your database
    const mockCustomer = {
      id: user.id,
      userId: user.id,
      stripeCustomerId: `cus_${user.id}`,
      email: user.email,
      currentTier: 'free' as const,
      alertsUsed: 3,
      subscriptionStatus: undefined,
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
    console.error('Subscription status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription status'
    });
  }
});

export default router;
