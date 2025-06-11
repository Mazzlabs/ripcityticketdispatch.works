import nodemailer from 'nodemailer';
import twilio from 'twilio';
import webpush from 'web-push';
import { db } from '../database/connection';
import { Deal } from './dealScoring';

interface AlertService {
  sendEmail(to: string, subject: string, html: string): Promise<boolean>;
  sendSMS(to: string, message: string): Promise<boolean>;
  sendPushNotification(subscription: any, payload: any): Promise<boolean>;
}

export class ProductionAlertService implements AlertService {
  private emailTransporter: nodemailer.Transporter;
  private twilioClient: twilio.Twilio;
  
  constructor() {
    // Email setup (SendGrid)
    this.emailTransporter = nodemailer.createTransporter({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
    
    // SMS setup (Twilio)
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
    
    // Push notifications setup
    webpush.setVapidDetails(
      'mailto:alerts@ripcityticketdispatch.works',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
  }
  
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.FROM_EMAIL || 'alerts@ripcityticketdispatch.works',
        to,
        subject,
        html
      });
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }
  
  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }
  
  async sendPushNotification(subscription: any, payload: any): Promise<boolean> {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('Push notification error:', error);
      return false;
    }
  }
  
  /**
   * Process and send deal alerts to eligible users
   */
  async processDealsForAlerts(deals: Deal[]): Promise<void> {
    try {
      // Get all active users with alert preferences
      const users = await db.user.findMany({
        where: {
          isActive: true,
          preferences: {
            path: ['alertMethods'],
            array_contains: ['email', 'sms', 'push']
          }
        }
      });
      
      for (const user of users) {
        const userDeals = this.filterDealsForUser(deals, user.preferences);
        
        if (userDeals.length === 0) continue;
        
        // Check alert cooldown
        if (await this.isUserInCooldown(user.id)) continue;
        
        // Send alerts based on user preferences
        const alertMethods = user.preferences.alertMethods || ['email'];
        
        for (const method of alertMethods) {
          switch (method) {
            case 'email':
              await this.sendDealEmail(user, userDeals);
              break;
            case 'sms':
              if (user.preferences.phoneNumber) {
                await this.sendDealSMS(user, userDeals);
              }
              break;
            case 'push':
              await this.sendDealPushNotification(user, userDeals);
              break;
          }
        }
        
        // Record alert sent
        await this.recordAlertSent(user.id, userDeals.length);
      }
      
    } catch (error) {
      console.error('Error processing deal alerts:', error);
    }
  }
  
  private filterDealsForUser(deals: Deal[], preferences: any): Deal[] {
    return deals.filter(deal => {
      // Filter by categories
      if (preferences.categories && !preferences.categories.includes(deal.category)) {
        return false;
      }
      
      // Filter by max price
      if (preferences.maxPrice && deal.currentPrice > preferences.maxPrice) {
        return false;
      }
      
      // Filter by minimum savings
      if (preferences.minSavings && deal.savingsPercentage < preferences.minSavings) {
        return false;
      }
      
      // Filter by venues
      if (preferences.venues && preferences.venues.length > 0) {
        const matchesVenue = preferences.venues.some((venue: string) =>
          deal.venue.toLowerCase().includes(venue.toLowerCase())
        );
        if (!matchesVenue) return false;
      }
      
      // Only send alerts for good deals
      return deal.alertLevel === 'hot' || deal.alertLevel === 'warm';
    });
  }
  
  private async isUserInCooldown(userId: string): Promise<boolean> {
    const cooldownMinutes = parseInt(process.env.ALERT_COOLDOWN_MINUTES || '15');
    const cooldownTime = new Date(Date.now() - cooldownMinutes * 60 * 1000);
    
    const recentAlert = await db.alertHistory.findFirst({
      where: {
        userId,
        sentAt: { gte: cooldownTime }
      }
    });
    
    return !!recentAlert;
  }
  
  private async sendDealEmail(user: any, deals: Deal[]): Promise<void> {
    const subject = deals.length === 1 
      ? `🔥 Hot Deal Alert: ${deals[0].eventName}`
      : `🔥 ${deals.length} Hot Deals Found!`;
    
    const html = this.generateEmailHTML(deals, user.firstName);
    
    await this.sendEmail(user.email, subject, html);
  }
  
  private async sendDealSMS(user: any, deals: Deal[]): Promise<void> {
    const topDeal = deals[0];
    const message = deals.length === 1
      ? `🔥 HOT DEAL: ${topDeal.eventName} at ${topDeal.venue} - $${topDeal.currentPrice} (${topDeal.savingsPercentage}% off)! ${topDeal.url}`
      : `🔥 ${deals.length} hot deals found! Check the app: https://ripcityticketdispatch.works`;
    
    await this.sendSMS(user.preferences.phoneNumber, message);
  }
  
  private async sendDealPushNotification(user: any, deals: Deal[]): Promise<void> {
    // Get user's push subscriptions
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: user.id }
    });
    
    const topDeal = deals[0];
    const payload = {
      title: deals.length === 1 ? '🔥 Hot Deal Alert!' : `🔥 ${deals.length} Hot Deals!`,
      body: deals.length === 1 
        ? `${topDeal.eventName} - $${topDeal.currentPrice} (${topDeal.savingsPercentage}% off)`
        : `New deals found for your preferences`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      url: 'https://ripcityticketdispatch.works',
      data: { dealIds: deals.map(d => d.id) }
    };
    
    for (const subscription of subscriptions) {
      await this.sendPushNotification(subscription.data, payload);
    }
  }
  
  private async recordAlertSent(userId: string, dealCount: number): Promise<void> {
    await db.alertHistory.create({
      data: {
        userId,
        dealCount,
        sentAt: new Date()
      }
    });
  }
  
  private generateEmailHTML(deals: Deal[], firstName: string): string {
    const dealsHTML = deals.map(deal => `
      <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 16px 0; background: white;">
        <h3 style="color: #E03A3E; margin: 0 0 8px 0;">${deal.eventName}</h3>
        <p style="margin: 4px 0;"><strong>Venue:</strong> ${deal.venue}</p>
        <p style="margin: 4px 0;"><strong>Date:</strong> ${deal.date} ${deal.time}</p>
        <p style="margin: 4px 0;">
          <strong style="color: #E03A3E;">Price: $${deal.currentPrice}</strong>
          <span style="text-decoration: line-through; color: #666; margin-left: 8px;">$${deal.originalPrice}</span>
        </p>
        <p style="margin: 4px 0; color: #E03A3E; font-weight: bold;">
          💰 Save ${deal.savingsPercentage}% ($${deal.savings})!
        </p>
        <div style="margin: 12px 0;">
          ${deal.tags.map(tag => `<span style="background: #E03A3E; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px; margin-right: 4px;">${tag}</span>`).join('')}
        </div>
        <a href="${deal.url}" style="background: #E03A3E; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Get Tickets Now
        </a>
      </div>
    `).join('');
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #E03A3E; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🏀 Rip City Ticket Dispatch</h1>
          <p style="margin: 8px 0 0 0;">Hot Deals Alert for ${firstName}</p>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hey ${firstName}! 👋</p>
          <p>We found ${deals.length} hot ticket deal${deals.length > 1 ? 's' : ''} matching your preferences:</p>
          
          ${dealsHTML}
          
          <div style="margin-top: 24px; padding: 16px; background: white; border-radius: 8px; text-align: center;">
            <p><strong>Want to customize your alerts?</strong></p>
            <a href="https://ripcityticketdispatch.works/profile" style="background: #E03A3E; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">
              Update Preferences
            </a>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            This alert was sent because you have deal notifications enabled. 
            You can adjust your settings anytime in your profile.
          </p>
        </div>
      </div>
    `;
  }
}

export const alertService = new ProductionAlertService();
