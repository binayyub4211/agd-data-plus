import nodemailer from 'nodemailer';
import { config } from '../config/config';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // e.g., your gmail address
      pass: process.env.SMTP_PASS, // e.g., your gmail app password
    },
  });

  private static async sendMail(to: string, subject: string, html: string) {
    try {
      // If SMTP is not configured, just log it (useful for dev without crashing)
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP not configured. Simulating email to:', to);
        console.log('Subject:', subject);
        return false;
      }

      await this.transporter.sendMail({
        from: `"AGD Data Plus" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  static async sendWelcomeEmail(to: string, name: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0F1E; color: #ffffff; padding: 20px; border-radius: 10px;">
        <h1 style="color: #00D4FF; text-align: center;">Welcome to AGD Data Plus!</h1>
        <p style="font-size: 16px;">Hello ${name},</p>
        <p style="font-size: 16px;">We are absolutely thrilled to have you on board. AGD Data Plus is your premium hub for VTU services, data bundles, and seamless bill payments.</p>
        <p style="font-size: 16px;">Log in today to explore the best rates in the country!</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/auth/login" style="background-color: #1A4FDB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to your Dashboard</a>
        </div>
      </div>
    `;
    return this.sendMail(to, 'Welcome to AGD Data Plus! 🎉', html);
  }

  static async sendPurchaseReceipt(to: string, name: string, service: string, amount: number, reference: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0F1E; color: #ffffff; padding: 20px; border-radius: 10px;">
        <h2 style="color: #00D4FF; border-bottom: 1px solid #1A4FDB; padding-bottom: 10px;">Purchase Successful!</h2>
        <p>Hi ${name},</p>
        <p>Your recent transaction was successful. Here are the details:</p>
        <div style="background-color: rgba(255,255,255,0.1); padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
          <p><strong>Reference:</strong> ${reference}</p>
          <p><strong>Status:</strong> <span style="color: #4ade80;">Success</span></p>
        </div>
        <p>Thank you for choosing AGD Data Plus!</p>
      </div>
    `;
    return this.sendMail(to, `Receipt: ${service} Purchase`, html);
  }

  static async sendAdminBroadcast(to: string, subject: string, message: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0F1E; color: #ffffff; padding: 20px; border-radius: 10px; border-top: 5px solid #1A4FDB;">
        <h2 style="color: #ffffff;">Important Update from AGD Data Plus</h2>
        <div style="margin-top: 20px; font-size: 16px; line-height: 1.5;">
          ${message}
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/dashboard" style="background-color: #00D4FF; color: #0A0F1E; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
        </div>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }
}
