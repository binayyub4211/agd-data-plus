import axios from 'axios';

const SENDER_EMAIL = process.env.SMTP_FROM || 'noreply@agddataplus.com.ng';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const envUrl = process.env.FRONTEND_URL;
const FRONTEND_URL = (envUrl && envUrl.trim() !== '' && envUrl !== 'undefined') ? envUrl : 'https://agddataplus.com.ng';

export class EmailService {
  private static readonly BRAND_NAME = 'AGD Data Plus';
  private static readonly PRIMARY_COLOR = '#1A4FDB';

  private static getBaseTemplate(content: string) {
    const logoUrl = 'https://agddataplus.com.ng/logo.png'; // Placeholder for live logo

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
        <div style="text-align: center; padding: 20px 0;">
          <img src="${logoUrl}" alt="${this.BRAND_NAME}" style="max-height: 60px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;" onerror="this.style.display='none'" />
          <h1 style="color: ${this.PRIMARY_COLOR}; margin: 0; font-size: 24px;">${this.BRAND_NAME}</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          ${content}
        </div>
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>&copy; 2026 ${this.BRAND_NAME}. All rights reserved.</p>
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
        <a href="${FRONTEND_URL}/#/dashboard" style="background-color: ${this.PRIMARY_COLOR}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
      </div>
      <p style="color: #555;">Start funding your wallet to enjoy the best rates on Data, Airtime, and more.</p>
    `);
    return this.sendEmail(email, `Welcome to ${this.BRAND_NAME}`, html);
  }

  static async sendFundingNotification(email: string, amount: number, balance: number) {
    const html = this.getBaseTemplate(`
      <h2 style="color: #333;">Wallet Funded Successfully</h2>
      <p style="color: #555;">Your wallet has been credited with:</p>
      <div style="font-size: 24px; font-weight: bold; color: ${this.PRIMARY_COLOR}; margin: 20px 0;">
        &#8358;${amount.toLocaleString()}
      </div>
      <p style="color: #555;">New Wallet Balance: <strong>&#8358;${balance.toLocaleString()}</strong></p>
      <p style="color: #888; font-size: 12px; margin-top: 20px;">If you did not make this transaction, please contact support immediately.</p>
    `);
    return this.sendEmail(email, `Wallet Credit: NGN ${amount.toLocaleString()}`, html);
  }

  static async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${FRONTEND_URL}/#/auth/reset-password?token=${token}`;
    const html = this.getBaseTemplate(`
      <h2 style="color: #333;">Password Reset Request</h2>
      <p style="color: #555; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetLink}" style="background-color: ${this.PRIMARY_COLOR}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #888; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
    `);
    return this.sendEmail(email, `Reset Your Password - ${this.BRAND_NAME}`, html);
  }

  static async sendPurchaseReceipt(email: string, name: string, serviceType: string, amount: number, reference: string) {
    const html = this.getBaseTemplate(`
      <h2 style="color: #333;">Purchase Successful!</h2>
      <p style="color: #555;">Hi ${name}, your transaction details are below:</p>
      <div style="background-color: #f9f9f9; border-left: 4px solid ${this.PRIMARY_COLOR}; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0; color: #555;"><strong>Service:</strong> ${serviceType}</p>
        <p style="margin: 5px 0; color: #555;"><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
        <p style="margin: 5px 0; color: #555;"><strong>Reference:</strong> ${reference}</p>
        <p style="margin: 5px 0; color: #22c55e;"><strong>Status:</strong> Success</p>
      </div>
      <p style="color: #555;">Thank you for choosing AGD Data Plus!</p>
    `);
    return this.sendEmail(email, `Receipt: ${serviceType} Purchase`, html);
  }

  static async sendAdminBroadcastEmail(email: string, subject: string, message: string) {
    const html = this.getBaseTemplate(`
      <h2 style="color: #333;">Notification from Admin</h2>
      <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${message}</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${FRONTEND_URL}/#/dashboard" style="background-color: ${this.PRIMARY_COLOR}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
      </div>
    `);
    return this.sendEmail(email, subject, html);
  }

  private static async sendEmail(to: string, subject: string, html: string) {
    if (!BREVO_API_KEY) {
      console.warn('Email service skipped: BREVO_API_KEY not set');
      return;
    }

    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: this.BRAND_NAME, email: SENDER_EMAIL },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        },
        {
          headers: {
            'api-key': BREVO_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Email sent via Brevo API:', response.data.messageId);
      return response.data;
    } catch (error: any) {
      console.error('Email Delivery Error:', error.response?.data || error.message);
    }
  }
}
