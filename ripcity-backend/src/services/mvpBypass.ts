/**
 * MVP Service Bypasses - Mock implementations for pending API approvals
 * These services provide mock responses until Twilio, Stripe, and SendGrid are approved
 */

// Mock Stripe Service for MVP
export const mockStripeService = {
  async createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string) {
    return {
      id: `cs_mock_${Date.now()}`,
      url: `${successUrl}?mock=true&message=stripe_pending_approval`,
      object: 'checkout.session',
      status: 'mock_pending_approval'
    };
  },

  async createBillingPortalSession(customerId: string, returnUrl: string) {
    return {
      id: `bps_mock_${Date.now()}`,
      url: `${returnUrl}?mock=true&message=billing_pending_approval`,
      object: 'billing_portal.session'
    };
  },

  async createCustomer(email: string, userId: string) {
    return {
      id: `cus_mock_${userId}`,
      email,
      object: 'customer',
      created: Math.floor(Date.now() / 1000)
    };
  },

  verifyWebhookSignature(payload: any, signature: string) {
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

  getUsageStats(customer: any) {
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
export const mockTwilioService = {
  async sendSMS(to: string, message: string) {
    console.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
    return {
      sid: `SM_mock_${Date.now()}`,
      status: 'queued',
      to,
      body: message,
      dateSent: new Date().toISOString(),
      mock: true,
      note: 'Twilio approval pending - SMS functionality disabled'
    };
  },

  async sendDoubleOptIn(to: string, code: string) {
    console.log(`[MOCK DOUBLE OPT-IN] To: ${to}, Code: ${code}`);
    return {
      sid: `SM_optin_mock_${Date.now()}`,
      status: 'queued',
      to,
      body: `Your Rip City Events verification code: ${code}`,
      mock: true
    };
  },

  validatePhoneNumber(phoneNumber: string) {
    // Basic phone number validation
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
};

// Mock SendGrid Service for MVP
export const mockSendGridService = {
  async sendEmail(to: string, subject: string, html: string) {
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
    return {
      messageId: `msg_mock_${Date.now()}`,
      status: 'queued',
      to,
      subject,
      mock: true,
      note: 'SendGrid approval pending - email functionality disabled'
    };
  },

  async sendWelcomeEmail(to: string, firstName: string) {
    return this.sendEmail(
      to,
      'Welcome to Rip City Events Hub!',
      `
      <h1>Welcome ${firstName}!</h1>
      <p>Thank you for joining Rip City Events Hub. We're excited to help you find the best deals on Portland events!</p>
      <p><strong>Note:</strong> Email functionality is currently in mock mode pending SendGrid approval.</p>
      `
    );
  },

  async sendDealAlert(to: string, dealInfo: any) {
    return this.sendEmail(
      to,
      `🎫 Hot Deal Alert: ${dealInfo.name}`,
      `
      <h2>Hot Deal Found!</h2>
      <p><strong>${dealInfo.name}</strong></p>
      <p>Venue: ${dealInfo.venue}</p>
      <p>Original Price: $${dealInfo.originalPrice}</p>
      <p>Current Price: $${dealInfo.minPrice}</p>
      <p>Savings: $${dealInfo.originalPrice - dealInfo.minPrice}</p>
      `
    );
  }
};

// MVP Status Checker
export const mvpStatus = {
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

export default {
  mockStripeService,
  mockTwilioService,
  mockSendGridService,
  mvpStatus
};
