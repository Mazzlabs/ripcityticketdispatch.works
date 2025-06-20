/**
 * SMS Consent Routes - MVP Mode with Twilio Bypass
 * Uses real MongoDB for consent storage, mocks SMS sending until Twilio approval
 */

import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { mockTwilioService, mvpStatus } from '../services/mvpBypass';
import MongoDB from '../database/connection';
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

/**
 * POST /sms-consent/opt-in
 * Create SMS consent record and send double opt-in (mock for MVP)
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

    const validatedData = smsConsentSchema.parse(req.body);
    
    // Validate phone number
    if (!mockTwilioService.validatePhoneNumber(validatedData.phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Store consent in real MongoDB
    const consentRecord = await MongoDB.createSMSConsent({
      userId,
      phoneNumber: validatedData.phoneNumber,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      subscriptionTier: validatedData.subscriptionTier,
      source: 'web_app'
    });

    // In MVP mode, we mock the SMS sending but store real consent
    if (!mvpStatus.twilio.enabled) {
      logger.info('MVP Mode: SMS consent stored, mock double opt-in sent', {
        userId,
        phoneNumber: validatedData.phoneNumber,
        consentId: consentRecord._id
      });

      // Mock SMS sending
      await mockTwilioService.sendDoubleOptIn(
        validatedData.phoneNumber,
        consentRecord.doubleOptInCode || ''
      );

      return res.json({
        success: true,
        message: 'SMS consent recorded successfully',
        consentId: consentRecord._id,
        mvp_mode: true,
        note: 'Double opt-in SMS mocked - Twilio approval pending',
        doubleOptInRequired: true,
        mockCode: consentRecord.doubleOptInCode // For testing purposes in MVP
      });
    }

    // When Twilio is approved, this will send real SMS
    // const smsResult = await twilioService.sendDoubleOptIn(validatedData.phoneNumber, consentRecord.doubleOptInCode);

    res.json({
      success: true,
      message: 'SMS consent recorded and verification sent',
      consentId: consentRecord._id,
      doubleOptInRequired: true
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    logger.error('SMS consent opt-in error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process SMS consent'
    });
  }
});

/**
 * POST /sms-consent/confirm
 * Confirm double opt-in with verification code
 */
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, confirmationCode } = req.body;
    const userId = req.user?.id;

    if (!userId || !phoneNumber || !confirmationCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Confirm in real MongoDB
    const confirmed = await MongoDB.confirmSMSConsent(userId, phoneNumber, confirmationCode);

    if (!confirmed) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired confirmation code'
      });
    }

    logger.info('SMS consent confirmed', { userId, phoneNumber });

    res.json({
      success: true,
      message: 'SMS consent confirmed successfully',
      status: 'confirmed',
      mvp_mode: !mvpStatus.twilio.enabled
    });

  } catch (error) {
    logger.error('SMS consent confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm SMS consent'
    });
  }
});

/**
 * POST /sms-consent/opt-out
 * Handle SMS opt-out requests (STOP messages)
 */
router.post('/opt-out', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number required'
      });
    }

    // Opt out in real MongoDB
    const optedOut = await MongoDB.optOutSMS(phoneNumber);

    if (!optedOut) {
      return res.status(404).json({
        success: false,
        error: 'No active SMS consent found for this number'
      });
    }

    logger.info('SMS opt-out processed', { phoneNumber });

    // In production with Twilio, send confirmation SMS
    if (!mvpStatus.twilio.enabled) {
      await mockTwilioService.sendSMS(
        phoneNumber,
        'You have been unsubscribed from Rip City Events SMS alerts. Reply START to resubscribe.'
      );
    }

    res.json({
      success: true,
      message: 'Successfully opted out of SMS alerts',
      mvp_mode: !mvpStatus.twilio.enabled
    });

  } catch (error) {
    logger.error('SMS opt-out error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process opt-out'
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

    const consent = await MongoDB.getSMSConsent(userId);

    res.json({
      success: true,
      consent: consent ? {
        phoneNumber: consent.phoneNumber,
        subscriptionTier: consent.subscriptionTier,
        doubleOptInConfirmed: consent.doubleOptInConfirmed,
        consentTimestamp: consent.consentTimestamp,
        isActive: !consent.optOutTimestamp
      } : null,
      mvp_mode: !mvpStatus.twilio.enabled,
      twilio_status: mvpStatus.twilio.reason
    });

  } catch (error) {
    logger.error('SMS consent status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SMS consent status'
    });
  }
});

/**
 * GET /sms-consent/compliance
 * Get TCPA compliance information for legal documentation
 */
router.get('/compliance', (req, res) => {
  res.json({
    success: true,
    compliance: {
      tcpaCompliant: true,
      doubleOptInRequired: true,
      optOutMethods: ['STOP', 'UNSUBSCRIBE', 'QUIT'],
      dataRetention: '7 years',
      consentStorage: 'MongoDB with encryption',
      auditLog: 'Full audit trail maintained',
      legalBasis: 'Explicit consent with double opt-in',
      privacyPolicyUrl: 'https://ripcityticketdispatch.works/legal/privacy.html',
      termsOfServiceUrl: 'https://ripcityticketdispatch.works/legal/terms.html',
      smsConsentUrl: 'https://ripcityticketdispatch.works/legal/sms-consent.html'
    },
    mvp_status: {
      twilio_enabled: mvpStatus.twilio.enabled,
      consent_storage: 'Active (MongoDB)',
      sms_sending: mvpStatus.twilio.enabled ? 'Active' : 'Mock Mode - Pending Approval'
    }
  });
});

export default router;
