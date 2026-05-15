import axios from 'axios';
import { config } from '../config/config';

export class PaymentPointService {
  private static readonly BASE_URL = 'https://api.paymentpoint.co/api/v1';

  static async initializePayment(email: string, amount: number, reference: string) {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/payment/initialize`,
        {
          email,
          amount,
          reference,
          business_id: config.PAYMENTPOINT_BUSINESS_ID,
          callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/wallet?status=success`,
        },
        {
          headers: {
            Authorization: `Bearer ${config.PAYMENTPOINT_SECRET_KEY}`,
            'api-key': config.PAYMENTPOINT_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('PaymentPoint Initialization Error:', error.response?.data || error.message);
      throw new Error('Failed to initialize PaymentPoint transaction');
    }
  }

  static async createDedicatedAccount(email: string, name: string, phoneNumber: string) {
    try {
      // Safely grab keys and guarantee no hidden spaces
      const secretKey = config.PAYMENTPOINT_SECRET_KEY?.trim() || '';
      const apiKey = config.PAYMENTPOINT_API_KEY?.trim() || '';
      const businessId = config.PAYMENTPOINT_BUSINESS_ID?.trim() || '';

      // DEBUG: Log the first 4 characters of the keys to prove Railway is actually sending them!
      console.log('--- DEBUG: PAYMENTPOINT KEYS ---');
      console.log(`Secret Key starts with: ${secretKey.substring(0, 4)}...`);
      console.log(`API Key starts with: ${apiKey.substring(0, 4)}...`);
      console.log(`Business ID starts with: ${businessId.substring(0, 4)}...`);
      
      if (secretKey === 'plac' || apiKey === 'plac') {
         console.error('🚨 DANGER: Keys are stuck on "placeholder". Railway is not passing your variables!');
      }

      const response = await axios.post(
        `${this.BASE_URL}/createVirtualAccount`,
        {
          email,
          name,
          phoneNumber,
          bankCode: ['20946', '20897'], // PalmPay and Opay as per docs
          businessId: businessId,
        },
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'api-key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      // Log the exact response for debugging
      console.log('PaymentPoint Virtual Account Response:', response.data);

      if (response.data?.status === 'success' || response.data?.status === true) {
        const accounts = response.data.bankAccounts || response.data.accounts || response.data.data;
        if (Array.isArray(accounts) && accounts.length > 0) return accounts[0];
        if (accounts?.accountNumber || accounts?.account_number) return accounts;
        if (response.data.accountNumber || response.data.account_number) return response.data;
      }
      
      throw new Error(response.data?.message || 'Invalid response format from PaymentPoint');
    } catch (error: any) {
      console.error('PaymentPoint Virtual Account Error:', error.response?.data || error.message);
      // Throw the exact error message from the provider so it reaches the frontend
      throw new Error(error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create virtual account');
    }
  }

  static async verifyPayment(reference: string) {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/payment/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${config.PAYMENTPOINT_SECRET_KEY}`,
            'api-key': config.PAYMENTPOINT_API_KEY,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('PaymentPoint Verification Error:', error.response?.data || error.message);
      throw new Error('Failed to verify PaymentPoint transaction');
    }
  }
}
