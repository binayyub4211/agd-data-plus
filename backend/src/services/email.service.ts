import nodemailer from 'nodemailer';
import { config } from '../config/config';

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: Number(config.SMTP_PORT),
  secure: Number(config.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

export class EmailService {
  private static readonly BRAND_NAME = 'AGD Data Plus';
  private static readonly PRIMARY_COLOR = '#1A4FDB';

  private static getBaseTemplate(content: string) {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: ${this.PRIMARY_COLOR}; margin: 0;">${this.BRAND_NAME}</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          ${content}
        </div>
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>© 2026 ${this.BRAND_NAME}. All rights reserved.</p>
          <p>Powered by Speed. Secured by Trust.</p>
        </div>
      </div>
    `;
  }

  static async sendWelcomeEmail(email: string, name: string) {
    const html = this.getBaseTemplate(`
      <h2 style="color: #333;">Welcome aboard, ${name}!</h2>
      <p style="color: #555; line-height: 1.6;">We're excited to have you on <strong>${this.BRAND_NAME}</strong>. Your account is now active and ready for lightning-fast VTU services.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: ${this.PRIMARY_COLOR}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
      </div>
      <p style="color: #555;">Start funding your wallet to enjoy the best rates on Data, Airtime, and more!</p>
    `);

    return this.sendEmail(email, `Welcome to ${this.BRAND_NAME}! 🚀`, html);
  }

  static async sendFundingNotification(email: string, amount: number, balance: number) {
    const html = this.getBaseTemplate(`
      <h2 style="color: #333;">Wallet Funded Successfully! ✅</h2>
      <p style="color: #555;">Your wallet has been credited with:</p>
      <div style="font-size: 24px; font-weight: bold; color: ${this.PRIMARY_COLOR}; margin: 20px 0;">
        ₦${amount.toLocaleString()}
      </div>
      <p style="color: #555;">New Wallet Balance: <strong>₦${balance.toLocaleString()}</strong></p>
      <p style="color: #888; font-size: 12px; margin-top: 20px;">If you did not make this transaction, please contact support immediately.</p>
    `);

    return this.sendEmail(email, `Wallet Credit: ₦${amount.toLocaleString()} 💰`, html);
  }

  static async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    const html = this.getBaseTemplate(`
      <h2 style="color: #333;">Password Reset Request</h2>
      <p style="color: #555; line-height: 1.6;">We received a request to reset your password. Click the button below to choose a new one. This link will expire in 1 hour.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetLink}" style="background-color: ${this.PRIMARY_COLOR}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p style="color: #888; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
    `);

    return this.sendEmail(email, `Reset Your Password - ${this.BRAND_NAME}`, html);
  }

  private static async sendEmail(to: string, subject: string, html: string) {
    if (!config.SMTP_HOST || !config.SMTP_USER) {
      console.warn('Email service skipped: SMTP configuration missing');
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: `"${this.BRAND_NAME}" <${config.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email Delivery Error:', error);
      // We don't throw here to avoid crashing the main process
    }
  }
}
