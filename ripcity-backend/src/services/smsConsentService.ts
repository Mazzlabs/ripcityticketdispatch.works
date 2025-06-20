/**
 * RIP CITY TICKET DISPATCH - SMS Consent Service
 * TCPA Compliant SMS Opt-in/Opt-out Management
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */

import twilio from 'twilio';
import db from '../database/connection';
import { logger } from '../utils/logger';

interface SMSConsentData {
  userId: string;
  phoneNumber: string;
  subscriptionTier: string;
  ipAddress?: string;
  userAgent?: string;
  source?: string;
}

interface SMSConsentRecord {
  id: string;
  userId: string;
  phoneNumber: string;
  consentTimestamp: Date;
  optOutTimestamp?: Date;
  subscriptionTier: string;
  doubleOptInConfirmed: boolean;
  doubleOptInConfirmedAt?: Date;
  createdAt: Date;
}

class SMSConsentService {
  private twilioClient: twilio.Twilio | null;
  private mvpMode: boolean;

  constructor() {
    // Check if Twilio credentials are available
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('Twilio credentials not found - running in MVP mode (SMS bypassed)');
      this.mvpMode = true;
      this.twilioClient = null;
    } else {
      this.mvpMode = false;
      this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
  }

  /**
   * Format and validate phone number
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assume US)
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    throw new Error('Invalid phone number format');
  }

  /**
   * Validate phone number is mobile (for SMS)
   */
  private async validateMobileNumber(phoneNumber: string): Promise<boolean> {
    if (this.mvpMode || !this.twilioClient) {
      console.log('MVP Mode: Skipping phone number validation');
      return true; // Assume valid in MVP mode
    }
    
    try {
      const lookup = await this.twilioClient.lookups.v1.phoneNumbers(phoneNumber).fetch({ type: ['carrier'] });
      return lookup.carrier?.type === 'mobile';
    } catch (error) {
      logger.error('Phone number validation failed:', error);
      return false;
    }
  }

  /**
   * Create SMS consent record and send double opt-in
   */
  async createSMSConsent(data: SMSConsentData): Promise<{ success: boolean; doubleOptInCode?: string; error?: string }> {
    try {
      // Format and validate phone number
      const formattedPhone = this.formatPhoneNumber(data.phoneNumber);
      
      // Check if phone number is mobile
      const isMobile = await this.validateMobileNumber(formattedPhone);
      if (!isMobile) {
        return { success: false, error: 'Phone number must be a mobile number for SMS alerts' };
      }

      // Check if user already has SMS consent
      const existingConsent = await db.getSMSConsent(data.userId);
      if (existingConsent && existingConsent.doubleOptInConfirmed) {
        return { success: false, error: 'SMS alerts already enabled for this account' };
      }

      // Create consent record
      const consentRecord = await db.createSMSConsent({
        ...data,
        phoneNumber: formattedPhone
      });

      // Send double opt-in SMS
      const doubleOptInMessage = `🌹 Rip City Events Hub: Confirm SMS alerts by replying with code: ${consentRecord.doubleOptInCode}

Msg&data rates may apply. Reply STOP to opt-out.
Terms: ripcityticketdispatch.works/terms`;

      if (this.mvpMode || !this.twilioClient) {
        console.log('MVP Mode: SMS sending bypassed. Double opt-in code:', consentRecord.doubleOptInCode);
      } else {
        await this.twilioClient.messages.create({
          body: doubleOptInMessage,
          from: process.env.TWILIO_FROM_NUMBER,
          to: formattedPhone
        });
        logger.info(`Double opt-in SMS sent to ${formattedPhone} for user ${data.userId}`);
      }
      return { 
        success: true, 
        doubleOptInCode: consentRecord.doubleOptInCode || undefined
      };

    } catch (error) {
      logger.error('SMS consent creation failed:', error);
      return { success: false, error: 'Failed to process SMS consent' };
    }
  }

  /**
   * Confirm double opt-in
   */
  async confirmSMSConsent(userId: string, phoneNumber: string, confirmationCode: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const confirmed = await db.confirmSMSConsent(userId, formattedPhone, confirmationCode.toUpperCase());
      
      if (confirmed) {
        // Send confirmation message
        const confirmationMessage = `🎉 SMS alerts activated! You'll receive ticket deal alerts from Rip City Events Hub.

Reply STOP to opt-out anytime.
Support: support@ripcityticketdispatch.works`;

        if (this.mvpMode || !this.twilioClient) {
          console.log('MVP Mode: SMS confirmation bypassed for user', userId);
        } else {
          await this.twilioClient.messages.create({
            body: confirmationMessage,
            from: process.env.TWILIO_FROM_NUMBER,
            to: formattedPhone
          });
          logger.info(`SMS consent confirmed for user ${userId} at ${formattedPhone}`);
        }
      }
      
      return confirmed;
    } catch (error) {
      logger.error('SMS consent confirmation failed:', error);
      return false;
    }
  }

  /**
   * Process opt-out (STOP keyword)
   */
  async processOptOut(phoneNumber: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const optedOut = await db.optOutSMS(formattedPhone);
      
      if (optedOut) {
        // Send opt-out confirmation
        const optOutMessage = `You've been unsubscribed from Rip City Events Hub SMS alerts. No more messages will be sent to this number.

For support: support@ripcityticketdispatch.works`;

        if (this.mvpMode || !this.twilioClient) {
          console.log('MVP Mode: SMS opt-out confirmation bypassed for', formattedPhone);
        } else {
          await this.twilioClient.messages.create({
            body: optOutMessage,
            from: process.env.TWILIO_FROM_NUMBER,
            to: formattedPhone
          });
          logger.info(`SMS opt-out processed for ${formattedPhone}`);
        }
      }
      
      return optedOut;
    } catch (error) {
      logger.error('SMS opt-out processing failed:', error);
      return false;
    }
  }

  /**
   * Get user's SMS consent status
   */
  async getSMSConsentStatus(userId: string): Promise<SMSConsentRecord | null> {
    try {
      const result = await db.getSMSConsent(userId);
      if (!result) return null;
      
      return {
        id: result._id?.toString() || result.id,
        userId: result.userId.toString(),
        phoneNumber: result.phoneNumber,
        consentTimestamp: result.consentTimestamp,
        optOutTimestamp: result.optOutTimestamp || undefined,
        subscriptionTier: result.subscriptionTier || '',
        doubleOptInConfirmed: result.doubleOptInConfirmed || false,
        doubleOptInConfirmedAt: result.doubleOptInConfirmedAt || undefined,
        createdAt: result.createdAt
      };
    } catch (error) {
      logger.error('Failed to get SMS consent status:', error);
      return null;
    }
  }

  /**
   * Check if user can receive SMS alerts
   */
  async canReceiveSMS(userId: string): Promise<boolean> {
    try {
      const consent = await db.getSMSConsent(userId);
      return !!(consent && consent.doubleOptInConfirmed && !consent.optOutTimestamp);
    } catch (error) {
      logger.error('Failed to check SMS consent:', error);
      return false;
    }
  }

  /**
   * Check if phone number is opted out
   */
  async isPhoneOptedOut(phoneNumber: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const consent = await db.getSMSConsentByPhone(formattedPhone);
      return !!(consent && consent.optOutTimestamp);
    } catch (error) {
      logger.error('Failed to check phone opt-out status:', error);
      return true; // Err on the side of caution
    }
  }

  /**
   * Handle incoming SMS webhook from Twilio
   */
  async handleIncomingSMS(from: string, body: string): Promise<{ success: boolean; response?: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(from);
      const messageBody = body.trim().toUpperCase();

      // Handle STOP keywords
      const stopKeywords = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
      if (stopKeywords.includes(messageBody)) {
        const optedOut = await this.processOptOut(formattedPhone);
        return { 
          success: optedOut, 
          response: optedOut ? 'You have been unsubscribed from SMS alerts.' : 'Unable to process opt-out request.' 
        };
      }

      // Handle HELP keywords
      const helpKeywords = ['HELP', 'INFO', 'SUPPORT'];
      if (helpKeywords.includes(messageBody)) {
        return { 
          success: true, 
          response: `Rip City Events Hub - Ticket price alerts. Msg&data rates may apply. Text STOP to opt-out. Support: support@ripcityticketdispatch.works` 
        };
      }

      // Handle double opt-in confirmation (6-digit code)
      if (/^[A-Z0-9]{6}$/.test(messageBody)) {
        const consent = await db.getSMSConsentByPhone(formattedPhone);
        if (consent && consent.doubleOptInCode === messageBody) {
          const confirmed = await this.confirmSMSConsent(consent.userId.toString(), formattedPhone, messageBody);
          return { 
            success: confirmed, 
            response: confirmed ? '🎉 SMS alerts activated!' : 'Confirmation failed. Please try again.' 
          };
        }
      }

      // Default response for unrecognized messages
      return { 
        success: true, 
        response: 'Reply HELP for info or STOP to opt-out. Support: support@ripcityticketdispatch.works' 
      };

    } catch (error) {
      logger.error('Incoming SMS handling failed:', error);
      return { success: false, response: 'Unable to process your request.' };
    }
  }

  /**
   * Get SMS consent audit report
   */
  async getConsentAuditReport(startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      // This would query the database for compliance reporting
      // Implementation depends on specific audit requirements
      logger.info('SMS consent audit report requested');
      return [];
    } catch (error) {
      logger.error('Failed to generate SMS consent audit report:', error);
      return [];
    }
  }
}

export const smsConsentService = new SMSConsentService();
export default smsConsentService;
