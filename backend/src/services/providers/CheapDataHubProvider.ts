import axios from 'axios';
import { Provider } from '../../types/prisma';
import { ProviderService, BuyRequest } from './ProviderService';

export class CheapDataHubProvider extends ProviderService {
  public readonly name = Provider.CHEAP_DATA_HUB;
  
  private baseUrl = 'https://www.cheapdatahub.ng/api/v1/resellers';
  private apiKey = process.env.CHEAPDATAHUB_API_KEY;

  private get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async checkBalance(): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/wallet/balance/`, {
        headers: this.headers
      });
      
      if (response.data.status === "true") {
        return parseFloat(response.data.data.balance);
      }
      throw new Error(response.data.message || 'Failed to fetch balance');
    } catch (error: any) {
      console.error(`[${this.name}] Balance check failed:`, error.response?.data || error.message);
      return 0; // Return 0 to avoid breaking sync but alert admin
    }
  }

  async buyAirtime(request: BuyRequest): Promise<any> {
    try {
      console.log(`[${this.name}] Buying Airtime: ${request.amount} to ${request.phone}...`);
      
      const response = await axios.post(`${this.baseUrl}/airtime/purchase/`, {
        provider_id: parseInt(request.planCode), // We assume planCode is the provider_id for airtime
        phone_number: request.phone,
        amount: request.amount
      }, { headers: this.headers });

      if (response.data.status === "true") {
        return {
          status: 'success',
          reference: response.data.transaction_id || request.reference,
          message: response.data.message
        };
      }
      throw new Error(response.data.message || 'Airtime purchase failed');
    } catch (error: any) {
      console.error(`[${this.name}] Airtime Error:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  async buyData(request: BuyRequest): Promise<any> {
    try {
      console.log(`[${this.name}] Buying Data: Plan ${request.planCode} to ${request.phone}...`);
      
      const response = await axios.post(`${this.baseUrl}/data/purchase/`, {
        bundle_id: parseInt(request.planCode), // We assume planCode is the bundle_id
        phone_number: request.phone
      }, { headers: this.headers });

      if (response.data.status === "true") {
        return {
          status: 'success',
          reference: response.data.reference || request.reference,
          message: response.data.message
        };
      }
      throw new Error(response.data.message || 'Data purchase failed');
    } catch (error: any) {
      console.error(`[${this.name}] Data Error:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  async buyUtility(request: BuyRequest): Promise<any> {
    // Utilities are routed to VTpass per design
    throw new Error(`[${this.name}] Utilities are routed to VTpass.`);
  }

  async sendSms(sender: string, recipients: string[], message: string): Promise<any> {
    try {
      console.log(`[${this.name}] Sending Bulk SMS from ${sender} to ${recipients.length} numbers...`);
      
      const response = await axios.post(`${this.baseUrl}/sms/send/`, {
        sender: sender,
        recipients: recipients.join(','),
        message: message
      }, { headers: this.headers });

      if (response.data.status === "true") {
        return {
          status: 'success',
          reference: response.data.transaction_id || `sms-${Date.now()}`,
          message: response.data.message
        };
      }
      throw new Error(response.data.message || 'SMS delivery failed');
    } catch (error: any) {
      console.error(`[${this.name}] SMS Error:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }
}
