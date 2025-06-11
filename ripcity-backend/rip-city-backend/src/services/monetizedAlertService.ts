import { stripeService } from './stripeService';
import { logger } from '../utils/logger';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

export interface Alert {
  id: string;
  userId: string;
  dealId: string;
  eventName: string;
  venue: string;
  originalPrice: number;
  currentPrice: number;
  savings: number;
  savingsPercentage: number;
  alertLevel: 'hot' | 'warm' | 'good' | 'normal';
  sentAt: Date;
  method: 'email' | 'sms' | 'webhook';
}

export interface AlertPreferences {
  userId: string;
  email?: string;
  phone?: string;
  webhookUrl?: string;
  minSavingsPercentage: number;
  maxPrice?: number;
  categories: string[];
  venues: string[];
  enableEmail: boolean;
  enableSMS: boolean;
  enableWebhook: boolean;
}

export class MonetizedAlertService {
  private emailTransporter: nodemailer.Transporter;
  private twilioClient: twilio.Twilio;

  constructor() {
    // Email setup
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail', // or your preferred email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // SMS setup
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
  }

  /**
   * Send an alert to a user (enforces subscription limits)
   */
  async sendAlert(
    userId: string, 
    deal: any, 
    preferences: AlertPreferences,
    customer: any
  ): Promise<{ success: boolean; error?: string; limitReached?: boolean }> {
    try {
      // Check if user can send more alerts based on their subscription
      if (!stripeService.canPerformAction(customer, 'send_alert')) {
        logger.warn('User reached alert limit', { 
          userId, 
          tier: customer.currentTier, 
          alertsUsed: customer.alertsUsed,
          alertsLimit: customer.alertsLimit 
        });
        
        return {
          success: false,
          error: 'Alert limit reached for your subscription tier',
          limitReached: true
        };
      }

      const alert: Alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        dealId: deal.id,
        eventName: deal.eventName,
        venue: deal.venue,
        originalPrice: deal.originalPrice,
        currentPrice: deal.currentPrice,
        savings: deal.savings,
        savingsPercentage: deal.savingsPercentage,
        alertLevel: deal.alertLevel,
        sentAt: new Date(),
        method: 'email' // Will be updated based on what's sent
      };

      const results = [];

      // Send email alert (available to all tiers)
      if (preferences.enableEmail && preferences.email) {
        try {
          await this.sendEmailAlert(alert, preferences.email);
          results.push({ method: 'email', success: true });
        } catch (error) {
          logger.error('Failed to send email alert', { error, userId, alertId: alert.id });
          results.push({ method: 'email', success: false, error });
        }
      }

      // Send SMS alert (Pro tier and above)
      if (preferences.enableSMS && preferences.phone && customer.currentTier !== 'free') {
        try {
          await this.sendSMSAlert(alert, preferences.phone);
          results.push({ method: 'sms', success: true });
        } catch (error) {
          logger.error('Failed to send SMS alert', { error, userId, alertId: alert.id });
          results.push({ method: 'sms', success: false, error });
        }
      }

      // Send webhook alert (Premium tier and above)
      if (preferences.enableWebhook && preferences.webhookUrl && 
          ['premium', 'enterprise'].includes(customer.currentTier)) {
        try {
          await this.sendWebhookAlert(alert, preferences.webhookUrl);
          results.push({ method: 'webhook', success: true });
        } catch (error) {
          logger.error('Failed to send webhook alert', { error, userId, alertId: alert.id });
          results.push({ method: 'webhook', success: false, error });
        }
      }

      // TODO: Increment user's alert count in database
      logger.info('Alert sent successfully', { 
        userId, 
        alertId: alert.id, 
        methods: results.map(r => r.method),
        tier: customer.currentTier 
      });

      return { success: true };

    } catch (error) {
      logger.error('Failed to send alert', { error, userId });
      return {
        success: false,
        error: 'Failed to send alert'
      };
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: Alert, email: string): Promise<void> {
    const subject = `🔥 ${alert.alertLevel.toUpperCase()} Deal Alert: ${alert.eventName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e53e3e;">🎟️ Rip City Ticket Alert</h2>
        
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2d3748;">${alert.eventName}</h3>
          <p><strong>Venue:</strong> ${alert.venue}</p>
          <p><strong>Original Price:</strong> $${alert.originalPrice}</p>
          <p><strong>Current Price:</strong> $${alert.currentPrice}</p>
          <p style="color: #38a169; font-size: 18px; font-weight: bold;">
            💰 Save $${alert.savings} (${alert.savingsPercentage}% off)
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://ripcityticketdispatch.works/deals/${alert.dealId}" 
             style="background: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Deal
          </a>
        </div>
        
        <p style="color: #718096; font-size: 12px; text-align: center;">
          Sent by Rip City Ticket Dispatch | 
          <a href="https://ripcityticketdispatch.works/unsubscribe">Unsubscribe</a>
        </p>
      </div>
    `;

    await this.emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || 'alerts@ripcityticketdispatch.works',
      to: email,
      subject,
      html
    });
  }

  /**
   * Send SMS alert (Pro+ only)
   */
  private async sendSMSAlert(alert: Alert, phone: string): Promise<void> {
    if (!this.twilioClient) {
      throw new Error('Twilio not configured');
    }

    const message = `🔥 DEAL ALERT: ${alert.eventName} at ${alert.venue}. Save $${alert.savings} (${alert.savingsPercentage}% off)! Was $${alert.originalPrice}, now $${alert.currentPrice}. View: ripcityticketdispatch.works/deals/${alert.dealId}`;

    await this.twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
  }

  /**
   * Send webhook alert (Premium+ only)
   */
  private async sendWebhookAlert(alert: Alert, webhookUrl: string): Promise<void> {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RipCityTicketDispatch/1.0'
      },
      body: JSON.stringify({
        type: 'deal_alert',
        data: alert,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }
  }

  /**
   * Get upgrade message for users who hit limits
   */
  getUpgradeMessage(currentTier: string, action: string): string {
    switch (action) {
      case 'sms_alerts':
        return `SMS alerts require Pro subscription or higher. Upgrade from ${currentTier} to unlock instant SMS notifications!`;
      
      case 'webhook_alerts':
        return `Custom webhooks require Premium subscription or higher. Upgrade from ${currentTier} to integrate with your own systems!`;
      
      case 'more_alerts':
        return `You've reached your daily alert limit. Upgrade from ${currentTier} to get unlimited alerts!`;
      
      case 'api_access':
        return `API access requires Premium subscription or higher. Upgrade from ${currentTier} to build custom integrations!`;
      
      default:
        return `Upgrade your subscription to unlock more features!`;
    }
  }
}

export const monetizedAlertService = new MonetizedAlertService();
