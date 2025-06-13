/**
 * RIP CITY TICKET DISPATCH - SMS Consent Routes
 * TCPA Compliant SMS Opt-in/Opt-out API Endpoints
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */

import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { smsConsentService } from '../services/smsConsentService';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const smsConsentSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  subscriptionTier: z.enum(['pro', 'premium', 'enterprise']),
  agreedToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to terms and conditions"
  }),
  agreedToSMS: z.boolean().refine(val => val === true, {
    message: "You must consent to SMS alerts"
  })
});

const confirmConsentSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  confirmationCode: z.string().length(6)
});

/**
 * POST /sms-consent/opt-in
 * Create SMS consent with double opt-in
 */
router.post('/opt-in', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { phoneNumber, subscriptionTier, agreedToTerms, agreedToSMS } = smsConsentSchema.parse(req.body);

    // Capture consent metadata for TCPA compliance
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await smsConsentService.createSMSConsent({
      userId,
      phoneNumber,
      subscriptionTier,
      ipAddress,
      userAgent,
      source: 'web_app'
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'SMS consent recorded. Please check your phone for a confirmation code.',
      requiresConfirmation: true
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('SMS opt-in failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process SMS consent'
    });
  }
});

/**
 * POST /sms-consent/confirm
 * Confirm double opt-in with SMS code
 */
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { phoneNumber, confirmationCode } = confirmConsentSchema.parse(req.body);

    const confirmed = await smsConsentService.confirmSMSConsent(userId, phoneNumber, confirmationCode);

    if (!confirmed) {
      return res.status(400).json({
        success: false,
        error: 'Invalid confirmation code or consent not found'
      });
    }

    res.json({
      success: true,
      message: 'SMS alerts activated successfully!'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('SMS confirmation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm SMS consent'
    });
  }
});

/**
 * GET /sms-consent/status
 * Get user's SMS consent status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const consent = await smsConsentService.getSMSConsentStatus(userId);

    if (!consent) {
      return res.json({
        success: true,
        smsEnabled: false,
        message: 'No SMS consent found'
      });
    }

    res.json({
      success: true,
      smsEnabled: consent.doubleOptInConfirmed && !consent.optOutTimestamp,
      phoneNumber: consent.phoneNumber.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4'), // Format for display
      subscriptionTier: consent.subscriptionTier,
      confirmedAt: consent.doubleOptInConfirmedAt,
      requiresConfirmation: !consent.doubleOptInConfirmed
    });

  } catch (error) {
    logger.error('Failed to get SMS consent status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SMS consent status'
    });
  }
});

/**
 * POST /sms-consent/opt-out
 * Manual opt-out through web interface
 */
router.post('/opt-out', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const consent = await smsConsentService.getSMSConsentStatus(userId);
    if (!consent || !consent.doubleOptInConfirmed) {
      return res.status(400).json({
        success: false,
        error: 'No active SMS consent found'
      });
    }

    const optedOut = await smsConsentService.processOptOut(consent.phoneNumber);

    if (!optedOut) {
      return res.status(500).json({
        success: false,
        error: 'Failed to process opt-out'
      });
    }

    res.json({
      success: true,
      message: 'Successfully opted out of SMS alerts'
    });

  } catch (error) {
    logger.error('SMS opt-out failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process opt-out'
    });
  }
});

/**
 * POST /sms-consent/webhook
 * Twilio webhook for incoming SMS messages
 */
router.post('/webhook', async (req, res) => {
  try {
    const { From, Body } = req.body;

    if (!From || !Body) {
      return res.status(400).send('Missing required parameters');
    }

    const result = await smsConsentService.handleIncomingSMS(From, Body);

    // Respond with TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${result.response || 'Message received'}</Message>
</Response>`;

    res.type('text/xml');
    res.send(twiml);

  } catch (error) {
    logger.error('SMS webhook processing failed:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Unable to process your request. For support: support@ripcityticketdispatch.works</Message>
</Response>`;

    res.type('text/xml');
    res.send(errorTwiml);
  }
});

/**
 * GET /sms-consent/compliance-info
 * Get TCPA compliance information for legal display
 */
router.get('/compliance-info', (req, res) => {
  res.json({
    success: true,
    tcpaCompliance: {
      disclosureText: `By providing your mobile number and checking this box, you consent to receive SMS text message alerts from Rip City Events Hub about ticket deals and price drops. Message frequency varies. Message and data rates may apply. You can opt-out at any time by replying STOP to any message. Reply HELP for customer support.`,
      
      termsUrl: `${process.env.FRONTEND_URL || 'https://ripcityticketdispatch.works'}/terms`,
      privacyUrl: `${process.env.FRONTEND_URL || 'https://ripcityticketdispatch.works'}/privacy`,
      
      supportInfo: {
        email: 'support@ripcityticketdispatch.works',
        hours: 'Monday-Friday 9AM-6PM PST'
      },
      
      optOutKeywords: ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'],
      helpKeywords: ['HELP', 'INFO', 'SUPPORT'],
      
      carrierNotice: 'Carriers are not liable for delayed or undelivered messages.',
      
      frequencyByTier: {
        pro: 'Up to 5 messages per day',
        premium: 'Up to 15 messages per day',
        enterprise: 'Up to 50 messages per day'
      }
    }
  });
});

export default router;
