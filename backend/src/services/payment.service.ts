import axios from 'axios';
import { config } from '../config/config';

export class PaymentService {
  private static readonly PAYSTACK_BASE_URL = 'https://api.paystack.co';

  static async initializePayment(email: string, amount: number) {
    try {
      const response = await axios.post(
        `${this.PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          email,
          amount: amount * 100, // Paystack works in kobo/cents
          callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/wallet?status=success`,
        },
        {
          headers: {
            Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Paystack Initialization Error:', error.response?.data || error.message);
      throw new Error('Failed to initialize payment');
    }
  }

  static async createCustomer(email: string, first_name: string, last_name: string, phone: string) {
    try {
      const response = await axios.post(
        `${this.PAYSTACK_BASE_URL}/customer`,
        { email, first_name, last_name, phone },
        {
          headers: { Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}` },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Paystack Create Customer Error:', error.response?.data || error.message);
      throw new Error('Failed to create Paystack customer');
    }
  }

  static async createVirtualAccount(customerCode: string, first_name?: string, last_name?: string, phone?: string) {
    try {
      const payload: any = { customer: customerCode, preferred_bank: 'wema-bank' };
      if (first_name) payload.first_name = first_name;
      if (last_name) payload.last_name = last_name;
      if (phone) payload.phone = phone;

      const response = await axios.post(
        `${this.PAYSTACK_BASE_URL}/dedicated_account`,
        payload, 
        {
          headers: { Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}` },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Paystack Virtual Account Error:', error.response?.data || error.message);
      // If virtual accounts aren't enabled for the integration yet, don't crash everything
      return null;
    }
  }

  static async verifyPayment(reference: string) {
    try {
      const response = await axios.get(
        `${this.PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Paystack Verification Error:', error.response?.data || error.message);
      throw new Error('Failed to verify payment');
    }
  }
}
