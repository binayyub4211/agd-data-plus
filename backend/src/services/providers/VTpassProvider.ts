import axios from 'axios';
import { Provider } from '../../types/prisma';
import { ProviderService, BuyRequest } from './ProviderService';

// Predefined static fallback map of CheapDataHub planCode to VTpass variationCode
const STATIC_VTPASS_DATA_CODES: Record<string, { serviceID: string; variationCode: string }> = {
  // MTN
  '43': { serviceID: 'mtn-data', variationCode: 'mtn-100mb-100' },
  '74': { serviceID: 'mtn-data', variationCode: 'mtn-200mb' },
  '76': { serviceID: 'mtn-data', variationCode: 'mtn-500mb-2days' },
  '78': { serviceID: 'mtn-data', variationCode: 'mtn-1gb-350' },
  '44': { serviceID: 'mtn-data', variationCode: 'mtn-500mb-30days' },
  '77': { serviceID: 'mtn-data', variationCode: 'mtn-1gb-2days' },
  '45': { serviceID: 'mtn-data', variationCode: 'mtn-1gb-7days' },
  '46': { serviceID: 'mtn-data', variationCode: 'mtn-30days-1gb' },
  '48': { serviceID: 'mtn-data', variationCode: 'mtn-30days-2gb' },
  '49': { serviceID: 'mtn-data', variationCode: 'mtn-30days-3gb' },
  '50': { serviceID: 'mtn-data', variationCode: 'mtn-30days-5gb' },

  // Glo
  '42': { serviceID: 'glo-data', variationCode: 'glo-100mb' },
  '35': { serviceID: 'glo-data', variationCode: 'glo-500mb' },
  '68': { serviceID: 'glo-data', variationCode: 'glo-1-05gb' },
  '36': { serviceID: 'glo-data', variationCode: 'glo-1-05gb' },
  '40': { serviceID: 'glo-data', variationCode: 'glo-2-9gb' },
  '37': { serviceID: 'glo-data', variationCode: 'glo-4-1gb' },
  '38': { serviceID: 'glo-data', variationCode: 'glo-5-8gb' },

  // Airtel
  '70': { serviceID: 'airtel-data', variationCode: 'airtel-1gb-3days' },
  '13': { serviceID: 'airtel-data', variationCode: 'airtel-500mb-30days' },
  '15': { serviceID: 'airtel-data', variationCode: 'airtel-1-5gb-7days' },
  '17': { serviceID: 'airtel-data', variationCode: 'airtel-2gb-30days' },
  '18': { serviceID: 'airtel-data', variationCode: 'airtel-3gb-30days' },
  '20': { serviceID: 'airtel-data', variationCode: 'airtel-8gb-30days' }
};

// Map of CheapDataHub planCode to details used for dynamic matching
const CHEAPDATAHUB_PLAN_SIZES: Record<string, { sizeVal: number; unit: 'MB' | 'GB'; serviceID: string }> = {
  // MTN
  '43': { sizeVal: 110, unit: 'MB', serviceID: 'mtn-data' },
  '74': { sizeVal: 230, unit: 'MB', serviceID: 'mtn-data' },
  '76': { sizeVal: 500, unit: 'MB', serviceID: 'mtn-data' },
  '78': { sizeVal: 1, unit: 'GB', serviceID: 'mtn-data' },
  '44': { sizeVal: 500, unit: 'MB', serviceID: 'mtn-data' },
  '77': { sizeVal: 1, unit: 'GB', serviceID: 'mtn-data' },
  '45': { sizeVal: 1, unit: 'GB', serviceID: 'mtn-data' },
  '46': { sizeVal: 1, unit: 'GB', serviceID: 'mtn-data' },
  '48': { sizeVal: 2, unit: 'GB', serviceID: 'mtn-data' },
  '49': { sizeVal: 3, unit: 'GB', serviceID: 'mtn-data' },
  '50': { sizeVal: 5, unit: 'GB', serviceID: 'mtn-data' },
  
  // Glo
  '42': { sizeVal: 200, unit: 'MB', serviceID: 'glo-data' },
  '35': { sizeVal: 500, unit: 'MB', serviceID: 'glo-data' },
  '68': { sizeVal: 1, unit: 'GB', serviceID: 'glo-data' },
  '36': { sizeVal: 1, unit: 'GB', serviceID: 'glo-data' },
  '40': { sizeVal: 2, unit: 'GB', serviceID: 'glo-data' },
  '37': { sizeVal: 3, unit: 'GB', serviceID: 'glo-data' },
  '38': { sizeVal: 5, unit: 'GB', serviceID: 'glo-data' },
  
  // Airtel
  '70': { sizeVal: 1, unit: 'GB', serviceID: 'airtel-data' },
  '13': { sizeVal: 500, unit: 'MB', serviceID: 'airtel-data' },
  '15': { sizeVal: 1, unit: 'GB', serviceID: 'airtel-data' },
  '17': { sizeVal: 2, unit: 'GB', serviceID: 'airtel-data' },
  '18': { sizeVal: 3, unit: 'GB', serviceID: 'airtel-data' },
  '20': { sizeVal: 8, unit: 'GB', serviceID: 'airtel-data' }
};

export class VTpassProvider extends ProviderService {
  public readonly name = Provider.VTPASS;
  
  private baseUrl = process.env.VTPASS_BASE_URL || 'https://sandbox.vtpass.com/api';
  private apiUsername = process.env.VTPASS_USERNAME || 'mmuktar1142@gmail.com';
  private apiPassword = process.env.VTPASS_PASSWORD || 'Binayyub@1142';
  
  private variationsCache = new Map<string, any[]>();

  private get authHeader() {
    return 'Basic ' + Buffer.from(`${this.apiUsername}:${this.apiPassword}`).toString('base64');
  }

  /**
   * Generates a compliant 12-digit date/time (YYYYMMDDHHII) GMT+1 (Lagos) request ID
   */
  private generateRequestId(): string {
    const now = new Date();
    // Get UTC milliseconds, then offset by GMT+1 (Lagos)
    const utcTimestamp = now.getTime() + (now.getTimezoneOffset() * 60000);
    const lagosTime = new Date(utcTimestamp + 3600000);
    
    const pad = (n: number) => String(n).padStart(2, '0');
    
    const yyyy = lagosTime.getFullYear();
    const mm = pad(lagosTime.getMonth() + 1);
    const dd = pad(lagosTime.getDate());
    const hh = pad(lagosTime.getHours());
    const ii = pad(lagosTime.getMinutes());
    
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${yyyy}${mm}${dd}${hh}${ii}${random}`;
  }

  /**
   * Fetches service variations dynamically with cache
   */
  private async getVariations(serviceID: string): Promise<any[]> {
    if (this.variationsCache.has(serviceID)) {
      return this.variationsCache.get(serviceID)!;
    }

    try {
      console.log(`[${this.name}] Fetching variations for ${serviceID}...`);
      const response = await axios.get(`${this.baseUrl}/service-variations?serviceID=${serviceID}`, {
        headers: { 'Authorization': this.authHeader }
      });

      const variations = response.data.content?.variations || response.data.content?.varations || [];
      if (variations.length > 0) {
        this.variationsCache.set(serviceID, variations);
      }
      return variations;
    } catch (error: any) {
      console.error(`[${this.name}] Failed to fetch variations for ${serviceID}:`, error.message);
      return [];
    }
  }

  /**
   * Checks the current VTpass wallet balance
   */
  async checkBalance(): Promise<number> {
    try {
      console.log(`[${this.name}] Querying wallet balance...`);
      const response = await axios.get(`${this.baseUrl}/balance`, {
        headers: { 'Authorization': this.authHeader }
      });

      if (response.data.code === '000' || response.data.response_description === '000') {
        const balance = parseFloat(response.data.content?.balance || '0');
        return balance;
      }
      
      throw new Error(response.data.response_description || 'Invalid response');
    } catch (error: any) {
      console.error(`[${this.name}] Failed to check balance:`, error.response?.data || error.message);
      throw new Error(`Failed to fetch ${this.name} balance: ${error.message}`);
    }
  }

  /**
   * Processes an Airtime Purchase
   */
  async buyAirtime(request: BuyRequest): Promise<any> {
    try {
      console.log(`[${this.name}] Processing airtime purchase for ${request.phone}...`);
      
      const reqId = this.generateRequestId();
      
      // Map frontend network keys: 1: MTN, 2: Glo, 3: Airtel, 4: 9mobile
      let serviceID = 'mtn';
      if (request.planCode === '2') serviceID = 'glo';
      else if (request.planCode === '3') serviceID = 'airtel';
      else if (request.planCode === '4') serviceID = 'etisalat';

      const payload = {
        request_id: reqId,
        serviceID,
        amount: request.amount,
        phone: request.phone
      };

      console.log(`[${this.name}] Sending payload:`, payload);

      const response = await axios.post(`${this.baseUrl}/pay`, payload, {
        headers: { 
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.code === '000' || response.data.response_description === 'TRANSACTION SUCCESSFUL') {
        console.log(`[${this.name}] Airtime Top-up Successful. RequestId: ${reqId}`);
        return {
          status: 'success',
          reference: request.reference,
          requestId: reqId,
          message: 'Airtime purchase successful',
          providerResponse: response.data
        };
      }

      throw new Error(response.data.response_description || 'Airtime purchase failed');
    } catch (error: any) {
      const errMsg = error.response?.data?.response_description || error.message;
      console.error(`[${this.name}] Airtime purchase failed:`, error.response?.data || error.message);
      throw new Error(errMsg);
    }
  }

  /**
   * Processes a Data Purchase
   */
  async buyData(request: BuyRequest): Promise<any> {
    try {
      console.log(`[${this.name}] Processing data purchase for ${request.phone}...`);
      
      const reqId = this.generateRequestId();
      const planMeta = CHEAPDATAHUB_PLAN_SIZES[request.planCode];
      
      let serviceID = 'mtn-data';
      let variationCode = '';

      if (planMeta) {
        serviceID = planMeta.serviceID;
        // Step 1: Try dynamic lookup
        const variations = await this.getVariations(serviceID);
        const searchSize = `${planMeta.sizeVal}${planMeta.unit}`.toLowerCase();
        
        const match = variations.find(v => {
          const name = String(v.name || '').toLowerCase();
          const code = String(v.variation_code || '').toLowerCase();
          return name.includes(searchSize) || code.includes(searchSize);
        });

        if (match) {
          variationCode = match.variation_code;
          console.log(`[${this.name}] Dynamically matched variation code: ${variationCode}`);
        }
      }

      // Step 2: Fallback to static mapping if dynamic lookup didn't yield a match
      if (!variationCode) {
        const fallback = STATIC_VTPASS_DATA_CODES[request.planCode];
        if (fallback) {
          serviceID = fallback.serviceID;
          variationCode = fallback.variationCode;
          console.log(`[${this.name}] Using static fallback variation code: ${variationCode}`);
        } else {
          throw new Error(`No variation code match found for CheapDataHub planCode: ${request.planCode}`);
        }
      }

      const payload = {
        request_id: reqId,
        serviceID,
        billersCode: request.phone,
        variation_code: variationCode,
        amount: request.amount,
        phone: request.phone
      };

      console.log(`[${this.name}] Sending data payload:`, payload);

      const response = await axios.post(`${this.baseUrl}/pay`, payload, {
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.code === '000' || response.data.response_description === 'TRANSACTION SUCCESSFUL') {
        console.log(`[${this.name}] Data Top-up Successful. RequestId: ${reqId}`);
        return {
          status: 'success',
          reference: request.reference,
          requestId: reqId,
          message: 'Data purchase successful',
          providerResponse: response.data
        };
      }

      throw new Error(response.data.response_description || 'Data purchase failed');
    } catch (error: any) {
      const errMsg = error.response?.data?.response_description || error.message;
      console.error(`[${this.name}] Data purchase failed:`, error.response?.data || error.message);
      throw new Error(errMsg);
    }
  }

  /**
   * Processes a Utility/Electricity/Cable Purchase
   */
  async buyUtility(request: BuyRequest): Promise<any> {
    try {
      console.log(`[${this.name}] Processing utility purchase: planCode=${request.planCode}, phone=${request.phone}...`);
      
      const reqId = this.generateRequestId();

      // Smart parsing of user inputs
      let serviceID = 'ikeja-electric';
      let billersCode = request.phone;
      let variation_code = 'prepaid';

      if (request.serviceType === 'CABLE') {
        serviceID = 'dstv';
        variation_code = 'dstv-padi';
      }

      const parts = request.planCode.split(/[:\s,/]+/);
      if (parts.length > 0) {
        const rawService = parts[0].toLowerCase();
        
        if (rawService.includes('dstv')) serviceID = 'dstv';
        else if (rawService.includes('gotv')) serviceID = 'gotv';
        else if (rawService.includes('startimes')) serviceID = 'startimes';
        else if (rawService.includes('ikeja')) serviceID = 'ikeja-electric';
        else if (rawService.includes('eko')) serviceID = 'eko-electric';
        else if (rawService.includes('abuja') || rawService.includes('aedc')) serviceID = 'abuja-electric';
        else if (rawService.includes('kano')) serviceID = 'kano-electric';
        else if (rawService.includes('portharcourt') || rawService.includes('phed')) serviceID = 'portharcourt-electric';
        else if (rawService.includes('jos')) serviceID = 'jos-electric';
        else if (rawService.includes('ibadan') || rawService.includes('ibedc')) serviceID = 'ibadan-electric';
        else if (rawService.includes('kaduna')) serviceID = 'kaduna-electric';

        if (rawService === 'prepaid' || rawService === 'postpaid') {
          variation_code = rawService;
        }
      }

      // Check if planCode contains numeric meter/smartcard ID
      const numPart = parts.find(p => /^\d{9,}$/.test(p));
      if (numPart) {
        billersCode = numPart;
      } else if (/^\d{9,}$/.test(request.planCode.trim())) {
        billersCode = request.planCode.trim();
      }

      // Check if planCode specifies prepaid/postpaid
      const varPart = parts.find(p => p.toLowerCase() === 'prepaid' || p.toLowerCase() === 'postpaid');
      if (varPart) {
        variation_code = varPart.toLowerCase();
      }

      // In Sandbox, override billersCode to 1212121212 to force success
      if (this.baseUrl.includes('sandbox')) {
        billersCode = '1212121212';
        console.log(`[${this.name}] Sandbox detected, overriding billersCode to ${billersCode} for testing`);
      }

      const payload: any = {
        request_id: reqId,
        serviceID,
        billersCode,
        amount: request.amount,
        phone: '07064889585' // Merchant notification phone
      };

      // Variation code is needed for both electric (prepaid/postpaid) and cable (package name)
      if (request.serviceType === 'ELECTRICITY') {
        payload.variation_code = variation_code;
      } else if (request.serviceType === 'CABLE') {
        payload.variation_code = variation_code;
        // Cable also needs subscription type (e.g. change / renew)
        payload.subscription_type = 'change';
      }

      console.log(`[${this.name}] Sending utility payload:`, payload);

      const response = await axios.post(`${this.baseUrl}/pay`, payload, {
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.code === '000' || response.data.response_description === 'TRANSACTION SUCCESSFUL') {
        console.log(`[${this.name}] Utility purchase successful. RequestId: ${reqId}`);
        return {
          status: 'success',
          reference: request.reference,
          requestId: reqId,
          message: 'Utility payment successful',
          providerResponse: response.data
        };
      }

      throw new Error(response.data.response_description || 'Utility transaction failed');
    } catch (error: any) {
      const errMsg = error.response?.data?.response_description || error.message;
      console.error(`[${this.name}] Utility purchase failed:`, error.response?.data || error.message);
      throw new Error(errMsg);
    }
  }

  async sendSms(sender: string, recipients: string[], message: string): Promise<any> {
    throw new Error(`[${this.name}] SMS delivery not implemented for this provider.`);
  }
}
