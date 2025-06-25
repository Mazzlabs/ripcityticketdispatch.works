import Stripe from 'stripe';
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
export declare class StripeService {
    private stripe;
    readonly tiers: Record<string, SubscriptionTier>;
    constructor();
    /**
     * Create a Stripe customer
     */
    createCustomer(email: string, userId: string, name?: string): Promise<Stripe.Customer>;
    /**
     * Create a subscription checkout session
     */
    createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string): Promise<Stripe.Checkout.Session>;
    /**
     * Create a billing portal session for subscription management
     */
    createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session>;
    /**
     * Get subscription details
     */
    getSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
    /**
     * Cancel a subscription
     */
    cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload: string, signature: string): Stripe.Event;
    /**
     * Check if user can perform action based on their tier limits
     */
    canPerformAction(customer: Customer, action: 'send_alert' | 'api_call'): boolean;
    /**
     * Get usage statistics for a customer
     */
    getUsageStats(customer: Customer): {
        currentTier: "free" | "pro" | "premium" | "enterprise";
        tierName: string;
        alertsUsed: number;
        alertsLimit: string | number;
        alertsRemaining: string | number;
        apiAccess: boolean;
        prioritySupport: boolean;
        subscriptionStatus: "active" | "canceled" | "past_due" | "unpaid" | undefined;
    };
}
export declare const stripeService: StripeService;
