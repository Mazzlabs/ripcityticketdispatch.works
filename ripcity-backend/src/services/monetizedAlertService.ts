import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { stripeService } from './stripeService';
import { smsConsentService } from './smsConsentService';
import { logger } from '../utils/logger';

export interface Alert {
  id: string;
  userId: string;
  dealId: string;
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
  webhook?: string;
  minSavingsPercentage: number;
  alertMethods: Array<'email' | 'sms' | 'webhook'>;
  maxAlertsPerDay: number;
  categories: string[];
  venues: string[];
}

class MonetizedAlertService {
  private emailTransporter: nodemailer.Transporter;
  private twilioClient!: twilio.Twilio;

  constructor() {
    // Email setup
    this.emailTransporter = nodemailer.createTransport({
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
  async sendAlert(userId: string, deal: any, preferences: AlertPreferences): Promise<Alert[]> {
    try {
      // Check user's subscription tier and limits
      const subscription = await stripeService.getSubscription(userId);
      const tier = subscription?.items.data[0]?.price.nickname || 'free';
      
      // Enforce tier limits
      const dailyLimit = this.getDailyAlertLimit(tier);
      const todayAlerts = await this.getTodayAlertCount(userId);
      
      if (todayAlerts >= dailyLimit) {
        logger.warn(`User ${userId} has reached daily alert limit (${dailyLimit})`);
        return [];
      }

      const alertsToSend: Alert[] = [];
      
      // Calculate savings
      const savings = deal.originalPrice - deal.currentPrice;
      const savingsPercentage = (savings / deal.originalPrice) * 100;
      
      // Check if deal meets user's minimum savings threshold
      if (savingsPercentage < preferences.minSavingsPercentage) {
        return [];
      }

      // Create alert object
      const alert: Alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        dealId: deal.id,
        venue: deal.venue,
        originalPrice: deal.originalPrice,
        currentPrice: deal.currentPrice,
        savings,
        savingsPercentage,
        alertLevel: this.getAlertLevel(savingsPercentage),
        sentAt: new Date(),
        method: 'email' // Will be updated per method
      };

      // Send email alert (all tiers)
      if (preferences.alertMethods.includes('email') && preferences.email) {
        try {
          await this.sendEmailAlert(preferences.email, alert, deal);
          alertsToSend.push({ ...alert, method: 'email' });
          logger.info(`Email alert sent to ${preferences.email} for deal ${deal.id}`);
        } catch (error) {
          logger.error('Failed to send email alert:', error);
        }
      }

      // Send SMS alert (Pro tier and above) - Check SMS consent first
      if (preferences.alertMethods.includes('sms') && preferences.phone && tier !== 'free') {
        try {
          // Verify SMS consent before sending
          const canReceiveSMS = await smsConsentService.canReceiveSMS(userId);
          
          if (canReceiveSMS) {
            await this.sendSMSAlert(preferences.phone, alert, deal);
            alertsToSend.push({ ...alert, method: 'sms' });
            logger.info(`SMS alert sent to ${preferences.phone} for deal ${deal.id}`);
          } else {
            logger.warn(`SMS consent not found or expired for user ${userId}`);
          }
        } catch (error) {
          logger.error('Failed to send SMS alert:', error);
        }
      }

      // Send webhook alert (Premium tier and above)
      if (preferences.alertMethods.includes('webhook') && preferences.webhook && tier === 'premium') {
        try {
          await this.sendWebhookAlert(preferences.webhook, alert, deal);
          alertsToSend.push({ ...alert, method: 'webhook' });
          logger.info(`Webhook alert sent to ${preferences.webhook} for deal ${deal.id}`);
        } catch (error) {
          logger.error('Failed to send webhook alert:', error);
        }
      }

      // TODO: Increment user's alert count in database
      
      return alertsToSend;
    } catch (error) {
      logger.error('Error in sendAlert:', error);
      return [];
    }
  }

  private getDailyAlertLimit(tier: string): number {
    switch (tier) {
      case 'free': return 3;
      case 'pro': return 15;
      case 'premium': return 50;
      default: return 3;
    }
  }

  private getAlertLevel(savingsPercentage: number): 'hot' | 'warm' | 'good' | 'normal' {
    if (savingsPercentage >= 50) return 'hot';
    if (savingsPercentage >= 30) return 'warm';
    if (savingsPercentage >= 15) return 'good';
    return 'normal';
  }

  private async getTodayAlertCount(userId: string): Promise<number> {
    // TODO: Implement database query to get today's alert count
    return 0;
  }

  private async sendEmailAlert(email: string, alert: Alert, deal: any): Promise<void> {
    const subject = `🎟️ ${alert.alertLevel.toUpperCase()} Deal Alert: ${deal.name}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e53e3e;">🎟️ Rip City Ticket Alert</h2>
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${deal.name}</h3>
          <p><strong>Venue:</strong> ${deal.venue}</p>
          <p><strong>Original Price:</strong> $${alert.originalPrice}</p>
          <p><strong>Current Price:</strong> $${alert.currentPrice}</p>
          <p style="color: #38a169; font-size: 18px; font-weight: bold;">
            💰 Save $${alert.savings} (${alert.savingsPercentage.toFixed(1)}%)
          </p>
          <a href="${deal.url}" style="background: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">
            View Deal
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">
          This alert was sent because the deal meets your savings threshold of ${alert.savingsPercentage}%.
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

  private async sendSMSAlert(phone: string, alert: Alert, deal: any): Promise<void> {
    if (!this.twilioClient) {
      throw new Error('Twilio not configured');
    }

    // Check if phone number is opted out before sending
    const isOptedOut = await smsConsentService.isPhoneOptedOut(phone);
    if (isOptedOut) {
      throw new Error('Phone number has opted out of SMS alerts');
    }

    const message = `🌹 RIP CITY ALERT: ${deal.name} at ${deal.venue}. Was $${alert.originalPrice}, now $${alert.currentPrice}. Save $${alert.savings} (${alert.savingsPercentage.toFixed(1)}%)! ${deal.url}

Reply STOP to opt-out`;

    await this.twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_FROM_NUMBER,
      to: phone
    });
  }

  private async sendWebhookAlert(webhookUrl: string, alert: Alert, deal: any): Promise<void> {
    const payload = {
      alert,
      deal,
      timestamp: new Date().toISOString(),
      source: 'ripcityticketdispatch'
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RipCityTicketDispatch/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Get user's alert preferences
   */
  async getAlertPreferences(userId: string): Promise<AlertPreferences | null> {
    // TODO: Implement database query
    return {
      userId,
      email: 'user@example.com',
      minSavingsPercentage: 15,
      alertMethods: ['email'],
      maxAlertsPerDay: 5,
      categories: ['sports'],
      venues: ['Moda Center']
    };
  }

  /**
   * Update user's alert preferences
   */
  async updateAlertPreferences(userId: string, preferences: Partial<AlertPreferences>): Promise<void> {
    // TODO: Implement database update
    logger.info(`Updated alert preferences for user ${userId}`, preferences);
  }
}

export const monetizedAlertService = new MonetizedAlertService();
export default monetizedAlertService;
