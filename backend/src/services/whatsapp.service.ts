import axios from 'axios';

export class WhatsAppService {
  private static token = process.env.WHATSAPP_TOKEN || '';
  private static phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  private static apiVersion = 'v17.0';

  /**
   * Sends a standard text message to a WhatsApp number.
   * @param to The recipient's phone number in international format (e.g., "2349016514818")
   * @param text The markdown-formatted text message to send.
   */
  static async sendText(to: string, text: string): Promise<any> {
    const cleanTo = this.formatPhoneNumber(to);
    
    // Fallback if no credentials exist (allows testing and simulator mode)
    if (!this.token || !this.phoneNumberId) {
      console.log(`[WhatsApp Outbound MOCK] To: ${cleanTo} | Body: ${text}`);
      return { mock: true, message: 'Mock sent successfully' };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanTo,
      type: 'text',
      text: {
        body: text,
      },
    };

    try {
      console.log(`[WhatsApp Outbound] Sending message to ${cleanTo}...`);
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      console.error(`[WhatsApp Outbound Error] Failed to send message to ${cleanTo}:`, errorMsg);
      throw new Error(`WhatsApp API delivery failed: ${error.message}`);
    }
  }

  /**
   * Helper to ensure phone numbers are in international format without leading plus or zeros.
   * e.g., "+234 901 651 4818" or "09016514818" -> "2349016514818"
   */
  private static formatPhoneNumber(phone: string): string {
    let clean = phone.replace(/\D/g, ''); // strip all non-digits
    
    // If it starts with 0 and is a typical Nigerian number (11 digits), format to international 234
    if (clean.startsWith('0') && clean.length === 11) {
      clean = '234' + clean.slice(1);
    }
    
    // Default fallback
    return clean;
  }
}
