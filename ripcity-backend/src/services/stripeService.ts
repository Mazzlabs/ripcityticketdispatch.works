import Stripe from 'stripe';
import { logger } from '../utils/logger';

export interface SubscriptionTier {
  id: string;
  name: string;
  priceId: string;
  price: number;
  features: string[];
  maxAlerts: number;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface Customer {
  id: string;
  userId: string;
  stripeCustomerId: string;
  email: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentTier: 'free' | 'pro' | 'premium' | 'enterprise';
  alertsUsed: number;
  alertsLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export class StripeService {
  private stripe: Stripe;
  
  // Subscription tiers with Stripe price IDs
  public readonly tiers: Record<string, SubscriptionTier> = {
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

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16'
    });
  }

  /**
   * Create a Stripe customer
   */
  async createCustomer(email: string, userId: string, name?: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        metadata: {
          userId
        },
        name
      });
      
      logger.info('Created Stripe customer', { customerId: customer.id, userId, email });
      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', { error, userId, email });
      throw error;
    }
  }

  /**
   * Create a subscription checkout session
   */
  async createCheckoutSession(
    customerId: string, 
    priceId: string, 
    successUrl: string, 
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
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
      
      logger.info('Created checkout session', { sessionId: session.id, customerId, priceId });
      return session;
    } catch (error) {
      logger.error('Failed to create checkout session', { error, customerId, priceId });
      throw error;
    }
  }

  /**
   * Create a billing portal session for subscription management
   */
  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });
      
      logger.info('Created billing portal session', { sessionId: session.id, customerId });
      return session;
    } catch (error) {
      logger.error('Failed to create billing portal session', { error, customerId });
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Failed to retrieve subscription', { error, subscriptionId });
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      logger.info('Cancelled subscription', { subscriptionId });
      return subscription;
    } catch (error) {
      logger.error('Failed to cancel subscription', { error, subscriptionId });
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
    }
    
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      logger.error('Failed to verify webhook signature', { error });
      throw error;
    }
  }

  /**
   * Check if user can perform action based on their tier limits
   */
  canPerformAction(customer: Customer, action: 'send_alert' | 'api_call'): boolean {
    const tier = this.tiers[customer.currentTier];
    
    switch (action) {
      case 'send_alert':
        if (tier.maxAlerts === -1) return true; // Unlimited
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
  getUsageStats(customer: Customer) {
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

export const stripeService = new StripeService();
