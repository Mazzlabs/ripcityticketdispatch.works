const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Middleware
app.use(cors({
  origin: [
    'https://ripcityticketdispatch.works',
    'https://www.ripcityticketdispatch.works', 
    'https://api.ripcityticketdispatch.works',
    'http://localhost:3000',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock deals endpoint
app.get('/api/deals', (req, res) => {
  const mockDeals = [
    {
      id: 'deal1',
      eventName: 'Portland Trail Blazers vs Los Angeles Lakers',
      venue: 'Moda Center',
      eventDate: '2025-06-15',
      originalPrice: 150,
      currentPrice: 89,
      savings: 61,
      savingsPercentage: 41,
      dealScore: 87,
      alertLevel: 'hot',
      category: 'basketball'
    },
    {
      id: 'deal2',
      eventName: 'Portland Timbers vs Seattle Sounders',
      venue: 'Providence Park',
      eventDate: '2025-06-20',
      originalPrice: 80,
      currentPrice: 45,
      savings: 35,
      savingsPercentage: 44,
      dealScore: 82,
      alertLevel: 'hot',
      category: 'soccer'
    },
    {
      id: 'deal3',
      eventName: 'Summer Concert Series',
      venue: 'Theater of the Clouds',
      eventDate: '2025-06-25',
      originalPrice: 120,
      currentPrice: 85,
      savings: 35,
      savingsPercentage: 29,
      dealScore: 65,
      alertLevel: 'warm',
      category: 'music'
    }
  ];

  res.json({
    success: true,
    deals: mockDeals,
    metadata: {
      count: mockDeals.length,
      timestamp: new Date().toISOString()
    }
  });
});

// Payment Plans endpoint
app.get('/api/payments/plans', (req, res) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: ['Basic deal alerts', '5 alerts per day', 'Email notifications'],
      maxAlerts: 5,
      apiAccess: false,
      prioritySupport: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      features: ['Real-time alerts', 'Unlimited alerts', 'SMS notifications', 'Advanced filtering'],
      maxAlerts: 'Unlimited',
      apiAccess: false,
      prioritySupport: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 19.99,
      features: ['All Pro features', 'API access', 'Custom webhooks', 'Historical data'],
      maxAlerts: 'Unlimited', 
      apiAccess: true,
      prioritySupport: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99.99,
      features: ['All Premium features', 'White-label API', 'Bulk data access', 'Priority support'],
      maxAlerts: 'Unlimited',
      apiAccess: true,
      prioritySupport: true
    }
  ];

  res.json({
    success: true,
    plans
  });
});

// Create checkout session
app.post('/api/payments/create-checkout', async (req, res) => {
  try {
    const { planId, email, userId } = req.body;

    // Validation
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required'
      });
    }

    if (!planId || planId === 'free') {
      return res.json({
        success: true,
        message: 'Free plan activated - no payment required',
        redirectUrl: '/dashboard',
        planActivated: 'free'
      });
    }

    if (planId === 'enterprise') {
      return res.json({
        success: true,
        message: 'Enterprise plan - contact sales for custom pricing',
        redirectUrl: 'mailto:joseph@mazzlabs.works?subject=Enterprise Plan Inquiry - Immediate Interest',
        requiresContact: true
      });
    }

    // Validate plan exists
    const validPlans = ['pro', 'premium'];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
      });
    }

    // For production, this would create actual Stripe checkout
    // For now, simulate successful checkout creation
    const mockSessionId = 'cs_live_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // In production, replace with actual Stripe checkout URL
    const checkoutUrl = `https://checkout.stripe.com/pay/${mockSessionId}#success`;

    // Log transaction attempt for monitoring
    console.log('💳 Checkout session created:', {
      sessionId: mockSessionId,
      planId,
      email: email.substring(0, 3) + '***', // Privacy
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      sessionId: mockSessionId,
      checkoutUrl: checkoutUrl,
      planId: planId,
      message: `Checkout session created for ${planId} plan`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

  } catch (error) {
    console.error('💥 Checkout creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment system temporarily unavailable. Please try again.',
      errorCode: 'CHECKOUT_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Webhook endpoint (placeholder)
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  console.log('💰 Stripe webhook received');
  res.json({ received: true });
});

// API-only endpoints - no static file serving (Cloudflare handles frontend)
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Rip City API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API route not found'
  });
});

// Catch-all for non-API routes (CORS preflight, etc)
app.use('*', (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
  } else {
    res.status(404).json({
      success: false,
      error: 'Route not found - this is an API-only server'
    });
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Rip City Backend running on port ${PORT}`);
  console.log(`🏀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💰 Stripe configured: ${!!process.env.STRIPE_SECRET_KEY}`);
  console.log(`🌐 Serving frontend from: ${path.join(__dirname, '..', '..')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;
