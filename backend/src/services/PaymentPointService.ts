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
      const response = await axios.post(
        `${this.BASE_URL}/createVirtualAccount`,
        {
          email,
          name,
          phoneNumber,
          bankCode: ['20946', '20897'], // PalmPay and Opay as per docs
          businessId: config.PAYMENTPOINT_BUSINESS_ID,
        },
        {
          headers: {
            Authorization: `Bearer ${config.PAYMENTPOINT_SECRET_KEY}`,
            'api-key': config.PAYMENTPOINT_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      // Return the first bank account from the array
      if (response.data?.status === 'success' && response.data.bankAccounts?.length > 0) {
        return response.data.bankAccounts[0];
      }
      
      return null;
    } catch (error: any) {
      console.error('PaymentPoint Virtual Account Error:', error.response?.data || error.message);
      return null;
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
