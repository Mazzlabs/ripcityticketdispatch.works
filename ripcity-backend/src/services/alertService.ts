import nodemailer from 'nodemailer';
import { Deal } from './dealScoring';

interface AlertService {
  sendEmail(to: string, subject: string, html: string): Promise<boolean>;
  sendDealAlert(userEmail: string, deal: Deal): Promise<boolean>;
}

export class ProductionAlertService implements AlertService {
  private emailTransporter: nodemailer.Transporter;
  
  constructor() {
    // Email setup (using environment variables for configuration)
    if (process.env.SMTP_HOST) {
      // Custom SMTP configuration
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else if (process.env.SENDGRID_API_KEY) {
      // SendGrid configuration
      this.emailTransporter = nodemailer.createTransporter({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    } else {
      // Development mode - log emails instead of sending
      this.emailTransporter = nodemailer.createTransporter({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    }
  }
  
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const result = await this.emailTransporter.sendMail({
        from: process.env.FROM_EMAIL || 'alerts@ripcityticketdispatch.works',
        to,
        subject,
        html
      });
      
      // In development mode, log the email content
      if (!process.env.SMTP_HOST && !process.env.SENDGRID_API_KEY) {
        console.log('📧 EMAIL ALERT (DEV MODE):');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content: ${html}`);
        console.log('---');
      }
      
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }
  
  async sendDealAlert(userEmail: string, deal: Deal): Promise<boolean> {
    const subject = `🎟️ Great Deal Alert: ${deal.event.name}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #e53e3e, #dd6b20); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .deal-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .price { font-size: 24px; font-weight: bold; color: #e53e3e; }
          .savings { background: #48bb78; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .button { display: inline-block; background: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { background: #f7fafc; padding: 15px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏀 Rip City Ticket Alert</h1>
            <p>We found an amazing deal for you!</p>
          </div>
          
          <div class="content">
            <div class="deal-card">
              <h2>${deal.event.name}</h2>
              <p><strong>Date:</strong> ${new Date(deal.event.date).toLocaleDateString()}</p>
              <p><strong>Venue:</strong> ${deal.event.venue}</p>
              <p><strong>Section:</strong> ${deal.section}</p>
              
              <div style="display: flex; align-items: center; gap: 10px; margin: 15px 0;">
                <span class="price">$${deal.price}</span>
                ${deal.savings > 0 ? `<span class="savings">${deal.savings}% OFF</span>` : ''}
              </div>
              
              <p><strong>Deal Score:</strong> ${deal.score}/100 ⭐</p>
              
              ${deal.reasons.length > 0 ? `
                <p><strong>Why this is a great deal:</strong></p>
                <ul>
                  ${deal.reasons.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
              ` : ''}
              
              <a href="${deal.ticketUrl}" class="button">Get Tickets Now 🎟️</a>
            </div>
          </div>
          
          <div class="footer">
            <p>You're receiving this because you signed up for Rip City Ticket Alerts.</p>
            <p><a href="https://ripcityticketdispatch.works/unsubscribe">Unsubscribe</a> | <a href="https://ripcityticketdispatch.works/preferences">Update Preferences</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await this.sendEmail(userEmail, subject, html);
  }
}

// Export a singleton instance
export const alertService = new ProductionAlertService();
