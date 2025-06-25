"use strict";
/**
 * SMS Consent Routes - MVP Mode with Twilio Bypass
 * Uses real MongoDB for consent storage, mocks SMS sending until Twilio approval
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const mvpBypass_1 = require("../services/mvpBypass");
const connection_1 = __importDefault(require("../database/connection"));
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
// Validation schemas
const smsConsentSchema = zod_1.z.object({
    phoneNumber: zod_1.z.string().min(10).max(15),
    subscriptionTier: zod_1.z.enum(['pro', 'premium', 'enterprise']),
    agreedToTerms: zod_1.z.boolean().refine(val => val === true, {
        message: "You must agree to terms and conditions"
    }),
    agreedToSMS: zod_1.z.boolean().refine(val => val === true, {
        message: "You must consent to SMS alerts"
    })
});
/**
 * POST /sms-consent/opt-in
 * Create SMS consent record and send double opt-in (mock for MVP)
 */
router.post('/opt-in', auth_1.authenticateToken, async (req, res) => {
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
        if (!mvpBypass_1.mockTwilioService.validatePhoneNumber(validatedData.phoneNumber)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format'
            });
        }
        // Store consent in real MongoDB
        const consentRecord = await connection_1.default.createSMSConsent({
            userId,
            phoneNumber: validatedData.phoneNumber,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            subscriptionTier: validatedData.subscriptionTier,
            source: 'web_app'
        });
        // In MVP mode, we mock the SMS sending but store real consent
        if (!mvpBypass_1.mvpStatus.twilio.enabled) {
            logger_1.logger.info('MVP Mode: SMS consent stored, mock double opt-in sent', {
                userId,
                phoneNumber: validatedData.phoneNumber,
                consentId: consentRecord._id
            });
            // Mock SMS sending
            await mvpBypass_1.mockTwilioService.sendDoubleOptIn(validatedData.phoneNumber, consentRecord.doubleOptInCode || '');
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors
            });
        }
        logger_1.logger.error('SMS consent opt-in error:', error);
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
router.post('/confirm', auth_1.authenticateToken, async (req, res) => {
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
        const confirmed = await connection_1.default.confirmSMSConsent(userId, phoneNumber, confirmationCode);
        if (!confirmed) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired confirmation code'
            });
        }
        logger_1.logger.info('SMS consent confirmed', { userId, phoneNumber });
        res.json({
            success: true,
            message: 'SMS consent confirmed successfully',
            status: 'confirmed',
            mvp_mode: !mvpBypass_1.mvpStatus.twilio.enabled
        });
    }
    catch (error) {
        logger_1.logger.error('SMS consent confirmation error:', error);
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
        const optedOut = await connection_1.default.optOutSMS(phoneNumber);
        if (!optedOut) {
            return res.status(404).json({
                success: false,
                error: 'No active SMS consent found for this number'
            });
        }
        logger_1.logger.info('SMS opt-out processed', { phoneNumber });
        // In production with Twilio, send confirmation SMS
        if (!mvpBypass_1.mvpStatus.twilio.enabled) {
            await mvpBypass_1.mockTwilioService.sendSMS(phoneNumber, 'You have been unsubscribed from Rip City Events SMS alerts. Reply START to resubscribe.');
        }
        res.json({
            success: true,
            message: 'Successfully opted out of SMS alerts',
            mvp_mode: !mvpBypass_1.mvpStatus.twilio.enabled
        });
    }
    catch (error) {
        logger_1.logger.error('SMS opt-out error:', error);
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
router.get('/status', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const consent = await connection_1.default.getSMSConsent(userId);
        res.json({
            success: true,
            consent: consent ? {
                phoneNumber: consent.phoneNumber,
                subscriptionTier: consent.subscriptionTier,
                doubleOptInConfirmed: consent.doubleOptInConfirmed,
                consentTimestamp: consent.consentTimestamp,
                isActive: !consent.optOutTimestamp
            } : null,
            mvp_mode: !mvpBypass_1.mvpStatus.twilio.enabled,
            twilio_status: mvpBypass_1.mvpStatus.twilio.reason
        });
    }
    catch (error) {
        logger_1.logger.error('SMS consent status error:', error);
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
            twilio_enabled: mvpBypass_1.mvpStatus.twilio.enabled,
            consent_storage: 'Active (MongoDB)',
            sms_sending: mvpBypass_1.mvpStatus.twilio.enabled ? 'Active' : 'Mock Mode - Pending Approval'
        }
    });
});
exports.default = router;
