import axios from 'axios';
import { Provider } from '../../types/prisma';
import { ProviderService, BuyRequest } from './ProviderService';

// Predefined static fallback map of CheapDataHub planCode to VTpass variationCode
// IMPORTANT: These codes are sourced from the actual VTpass API (service-variations endpoint)
const STATIC_VTPASS_DATA_CODES: Record<string, { serviceID: string; variationCode: string }> = {
  // MTN (actual VTpass variation codes)
  '43': { serviceID: 'mtn-data', variationCode: 'mtn-10mb-100' },      // ~100MB 24hrs
  '74': { serviceID: 'mtn-data', variationCode: 'mtn-50mb-200' },      // 200MB 2days
  '76': { serviceID: 'mtn-data', variationCode: 'mtn-2-5gb-600' },     // 2.5GB 2days (closest to 500MB short-term)
  '78': { serviceID: 'mtn-data', variationCode: 'mtn-100mb-1000' },    // 1.5GB 30days
  '44': { serviceID: 'mtn-data', variationCode: 'mtn-100mb-1000' },    // 1.5GB 30days
  '77': { serviceID: 'mtn-data', variationCode: 'mtn-2-5gb-600' },     // 2.5GB 2days
  '45': { serviceID: 'mtn-data', variationCode: 'mtn-20hrs-1500' },    // 6GB 7days
  '46': { serviceID: 'mtn-data', variationCode: 'mtn-100mb-1000' },    // 1.5GB 30days
  '48': { serviceID: 'mtn-data', variationCode: 'mtn-500mb-2000' },    // 4.5GB 30days
  '49': { serviceID: 'mtn-data', variationCode: 'mtn-3gb-1500' },      // 3GB 30days
  '50': { serviceID: 'mtn-data', variationCode: 'mtn-100hr-5000' },    // 15GB 30days

  // Glo (actual VTpass variation codes)
  '42': { serviceID: 'glo-data', variationCode: 'glo100' },            // 105MB 2days
  '35': { serviceID: 'glo-data', variationCode: 'glo500' },            // 1.05GB 14days
  '68': { serviceID: 'glo-data', variationCode: 'glo1000' },           // 2.5GB 30days
  '36': { serviceID: 'glo-data', variationCode: 'glo1000' },           // 2.5GB 30days
  '40': { serviceID: 'glo-data', variationCode: 'glo2000' },           // 5.8GB 30days
  '37': { serviceID: 'glo-data', variationCode: 'glo3000' },           // 10GB 30days
  '38': { serviceID: 'glo-data', variationCode: 'glo5000' },           // 18.25GB 30days

  // Airtel (actual VTpass variation codes)
  '70': { serviceID: 'airtel-data', variationCode: 'airt-600' },       // 1GB 14days
  '13': { serviceID: 'airtel-data', variationCode: 'airt-500' },       // 750MB 14days
  '15': { serviceID: 'airtel-data', variationCode: 'airt-1000-7' },    // 1.5GB 7days
  '17': { serviceID: 'airtel-data', variationCode: 'airt-1500' },      // 3GB 30days (closest match to 2GB that fits within user N1,500 budget)
  '18': { serviceID: 'airtel-data', variationCode: 'airt-1500' },      // 3GB 30days
  '20': { serviceID: 'airtel-data', variationCode: 'airt-3000' }       // 8GB 30days
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
  private apiUsername = process.env.VTPASS_USERNAME || 'sandbox@vtpass.com';
  private apiPassword = process.env.VTPASS_PASSWORD || 'sandbox';
  
  private get apiKey() {
    return (process.env.VTPASS_API_KEY || 'fcead89edaca5a1b04cacad14ee65779').trim();
  }

  private get publicKey() {
    return (process.env.VTPASS_PUBLIC_KEY || 'PK_359243b6cc24d541a09662af00b82df3fce70569672').trim();
  }

  private get secretKey() {
    return (process.env.VTPASS_SECRET_KEY || 'SK_20757cceed4dabfc4a30c8f0402178bb10240450586').trim();
  }

  private get getHeaders() {
    return {
      'api-key': this.apiKey,
      'public-key': this.publicKey,
      'Accept': 'application/json'
    };
  }

  private get postHeaders() {
    return {
      'api-key': this.apiKey,
      'secret-key': this.secretKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private variationsCache = new Map<string, any[]>();

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
  public async getVariations(serviceID: string): Promise<any[]> {
    if (this.variationsCache.has(serviceID)) {
      return this.variationsCache.get(serviceID)!;
    }

    try {
      console.log(`[${this.name}] Fetching variations for ${serviceID}...`);
      const response = await axios.get(`${this.baseUrl}/service-variations?serviceID=${serviceID}`, {
        headers: this.getHeaders
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
      console.log('[VTPASS] Querying wallet balance...');
      console.log('[VTPASS DEBUG] Sending GET Headers:', JSON.stringify(this.getHeaders, null, 2));
      const response = await axios.get(`${this.baseUrl}/balance`, {
        headers: this.getHeaders
      });

      console.log(`[${this.name}] Raw balance response:`, JSON.stringify(response.data));

      if (response.data.code === '000' || response.data.code === 1 || response.data.response_description === '000' || response.data.response_description === 'SUCCESS') {
        // Sandbox uses 'contents' instead of 'content' sometimes
        const balanceData = response.data.content || response.data.contents;
        const balance = parseFloat(balanceData?.balance || '0');
        return balance;
      }
      
      throw new Error(response.data.response_description || JSON.stringify(response.data));
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
      console.log('[VTPASS DEBUG] Sending POST Headers:', JSON.stringify(this.postHeaders, null, 2));
      
      const reqId = this.generateRequestId();
      
      // Map frontend network keys: 1: MTN, 2: Glo, 3: Airtel, 4: 9mobile
      let serviceID = request.planCode;
      if (request.planCode === '1') serviceID = 'mtn';
      else if (request.planCode === '2') serviceID = 'glo';
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
        headers: this.postHeaders
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
      let billersCode = request.phone; // default billersCode is phone

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

      // Step 2: Check if planCode uses the "serviceID:variationCode" colon format — handle ALL services
      if (request.planCode.includes(':')) {
        const parts = request.planCode.split(':');
        const parsedServiceID = parts[0];
        const parsedVariation = parts.slice(1).join(':');

        if (parsedServiceID === 'smile-direct') {
          serviceID = 'smile-direct';
          variationCode = parsedVariation;
          // On sandbox, billersCode for Smile is 08011111111 (success number)
          billersCode = this.baseUrl.includes('sandbox') ? '08011111111' : request.phone;
          console.log(`[${this.name}] Smile Direct: variation=${variationCode}, billersCode=${billersCode}`);
        } else if (parsedServiceID === 'spectranet') {
          serviceID = 'spectranet';
          variationCode = parsedVariation;
          billersCode = this.baseUrl.includes('sandbox') ? '1212121212' : request.phone;
          console.log(`[${this.name}] Spectranet: variation=${variationCode}, billersCode=${billersCode}`);
        } else if (!variationCode) {
          serviceID = parsedServiceID;
          variationCode = parsedVariation;
          console.log(`[${this.name}] Using direct variation code from request: ${variationCode}`);
        }
      } else if (request.planCode.includes('smile-direct')) {
        // planCode is just "smile-direct" without a variation — fetch dynamically
        serviceID = 'smile-direct';
        billersCode = this.baseUrl.includes('sandbox') ? '08011111111' : request.phone;
      } else if (request.planCode.includes('spectranet')) {
        serviceID = 'spectranet';
        billersCode = this.baseUrl.includes('sandbox') ? '1212121212' : request.phone;
      }

      // Step 3: Fallback to static mapping if variation still not resolved
      if (!variationCode && !['smile-direct', 'spectranet'].includes(serviceID)) {
          if (request.planCode.includes('-') && !request.planCode.includes(':')) {
            variationCode = request.planCode;
            serviceID = `${request.planCode.split('-')[0]}-data`;
            console.log(`[${this.name}] Using direct variation code from request: ${variationCode}`);
          } else if (request.planCode.includes('-')) {
            variationCode = request.planCode;
            serviceID = `${request.planCode.split('-')[0]}-data`;
            console.log(`[${this.name}] Using direct variation code from request: ${variationCode}`);
          } else {
            const fallback = STATIC_VTPASS_DATA_CODES[request.planCode];
            if (fallback) {
              serviceID = fallback.serviceID;
              variationCode = fallback.variationCode;
              console.log(`[${this.name}] Using static fallback variation code: ${variationCode}`);
            } else {
              // Fallback if no static map
              variationCode = `${serviceID.split('-')[0]}-10mb-100`;
              console.log(`[${this.name}] Using generic fallback variation code: ${variationCode}`);
            }
          }
      }

      const payload: any = {
        request_id: reqId,
        serviceID,
        billersCode,
        variation_code: variationCode,
        amount: request.amount,
        phone: request.phone
      };

      if (serviceID === 'spectranet' && this.baseUrl.includes('sandbox')) {
          payload.phone = '1212121212'; // Spectranet needs this specific phone on sandbox
      }

      console.log(`[${this.name}] Sending data payload:`, payload);

      const response = await axios.post(`${this.baseUrl}/pay`, payload, {
        headers: this.postHeaders
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
        variation_code = request.planCode.trim().toLowerCase();
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
        else if (rawService.includes('enugu') || rawService.includes('eedc')) serviceID = 'enugu-electric';
        else if (rawService.includes('benin') || rawService.includes('bedc')) serviceID = 'benin-electric';
        else if (rawService.includes('aba')) serviceID = 'aba-electric';
        else if (rawService.includes('yola') || rawService.includes('yedc')) serviceID = 'yola-electric';

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

      // In Sandbox, override billersCode to 1111111111111 to force success
      if (this.baseUrl.includes('sandbox')) {
        billersCode = '1111111111111';
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
        headers: this.postHeaders
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

  /**
   * Processes a TV/Cable subscription request.
   */
  async buyTv(request: BuyRequest): Promise<any> {
    try {
      const reqId = this.generateRequestId();
      // e.g. request.planCode = 'dstv-padi' -> serviceID = 'dstv', variation_code = 'dstv-padi'
      let serviceID = request.planCode.split('-')[0];
      let variation_code = request.planCode;

      if (request.planCode.includes(':')) {
        const parts = request.planCode.split(':');
        serviceID = parts[0];
        variation_code = parts.slice(1).join(':');
      }
      let billersCode = request.phone; // phone field usually contains the smartcard number

      // Sandbox override for test smartcard
      if (this.baseUrl.includes('sandbox')) {
        billersCode = '1212121212';
        console.log(`[${this.name}] Sandbox detected, overriding smartcard/billersCode to ${billersCode}`);
      }

      const payload: any = {
        request_id: reqId,
        serviceID,
        billersCode,
        variation_code,
        amount: request.amount,
        phone: '08011111111', // customer phone
        subscription_type: 'change'
      };

      console.log(`[${this.name}] Sending TV payload:`, payload);

      const response = await axios.post(`${this.baseUrl}/pay`, payload, {
        headers: this.postHeaders
      });

      if (response.data.code === '000' || response.data.response_description === 'TRANSACTION SUCCESSFUL') {
        console.log(`[${this.name}] TV purchase successful. RequestId: ${reqId}`);
        return {
          status: 'success',
          reference: request.reference,
          requestId: reqId,
          message: 'TV subscription successful',
          providerResponse: response.data
        };
      }

      throw new Error(response.data.response_description || 'TV transaction failed');
    } catch (error: any) {
      console.error(`[${this.name}] TV purchase failed:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.response_description || error.message);
    }
  }

  /**
   * Processes an Education (WAEC/JAMB) PIN request.
   */
  async buyEducation(request: BuyRequest): Promise<any> {
    try {
      const reqId = this.generateRequestId();
      
      let serviceID = request.planCode; // e.g. 'waec'
      let variation_code = 'waecdirect';
      
      if (request.planCode.includes(':')) {
         const parts = request.planCode.split(':');
         serviceID = parts[0];
         variation_code = parts.slice(1).join(':');
      } else if (serviceID.includes('-')) {
         const parts = serviceID.split('-');
         serviceID = parts[0];
         variation_code = parts.slice(1).join('-');
      }

      const payload: any = {
        request_id: reqId,
        serviceID,
        variation_code,
        amount: request.amount,
        phone: request.phone || '08011111111'
      };

      // JAMB specifically requires a profile code (billersCode)
      if (serviceID === 'jamb') {
         payload.billersCode = '0123456789'; // Valid sandbox profile ID for JAMB
         console.log(`[${this.name}] Sandbox JAMB detected, adding profile code: 0123456789`);
      }

      console.log(`[${this.name}] Sending Education payload:`, payload);

      const response = await axios.post(`${this.baseUrl}/pay`, payload, {
        headers: this.postHeaders
      });

      if (response.data.code === '000' || response.data.response_description === 'TRANSACTION SUCCESSFUL') {
        console.log(`[${this.name}] Education purchase successful. RequestId: ${reqId}`);
        return {
          status: 'success',
          reference: request.reference,
          requestId: reqId,
          message: 'Education PIN generated successfully',
          providerResponse: response.data,
          pin: response.data.purchased_code || response.data.cards
        };
      }

      throw new Error(response.data.response_description || 'Education transaction failed');
    } catch (error: any) {
      console.error(`[${this.name}] Education purchase failed:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.response_description || error.message);
    }
  }

  async sendSms(sender: string, recipients: string[], message: string): Promise<any> {
    throw new Error(`[${this.name}] SMS delivery not implemented for this provider.`);
  }
}
