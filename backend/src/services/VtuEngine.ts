import { ServiceType } from '../types/prisma';
import { CheapDataHubProvider } from './providers/CheapDataHubProvider';
import { VTpassProvider } from './providers/VTpassProvider';
import { BuyRequest } from './providers/ProviderService';

export class VtuEngine {
  private cheapDataHub = new CheapDataHubProvider();
  private vtpass = new VTpassProvider();

  /**
   * Orchestrates the purchase of VTU services with failover support.
   */
  async processTransaction(request: BuyRequest): Promise<{ success: boolean; providerUsed: string; response: any }> {
    console.log(`[VtuEngine] Processing transaction for ${request.serviceType}`);

    if (request.serviceType === ServiceType.DATA) {
      return this.handleDataPurchase(request);
    } 
    
    if (request.serviceType === ServiceType.AIRTIME) {
      return this.handleAirtimePurchase(request);
    }
    
    if (request.serviceType === ServiceType.ELECTRICITY || request.serviceType === ServiceType.CABLE) {
      return this.handleUtilityPurchase(request);
    }

    throw new Error(`[VtuEngine] Unsupported ServiceType: ${request.serviceType}`);
  }

  private async handleAirtimePurchase(request: BuyRequest) {
    try {
      // 1. Primary: CheapDataHub
      const response = await this.cheapDataHub.buyAirtime(request);
      
      // Calculate wholesale cost price based on standard 3% reseller discount for Airtime
      const costPrice = request.amount * 0.97;
      
      return { success: true, providerUsed: this.cheapDataHub.name, response, costPrice };
    } catch (primaryError: any) {
      console.warn(`[VtuEngine] Primary Provider (CheapDataHub) failed for Airtime. Initiating FAILOVER to VTpass... Reason: ${primaryError.message}`);
      
      try {
        // 2. Failover: VTpass
        const response = await this.vtpass.buyAirtime(request);
        const costPrice = request.amount; // VTpass airtime face value cost
        return { success: true, providerUsed: this.vtpass.name, response, costPrice };
      } catch (failoverError: any) {
        console.error(`[VtuEngine] CRITICAL: Both providers failed for AIRTIME.`, failoverError.message);
        throw new Error(`Airtime purchase failed across all providers. Primary: ${primaryError.message}. Failover: ${failoverError.message}`);
      }
    }
  }

  private async handleDataPurchase(request: BuyRequest) {
    try {
      // 1. Primary: CheapDataHub
      const response = await this.cheapDataHub.buyData(request);
      
      // Calculate wholesale cost price based on standard 5% reseller margin for Data bundles
      const costPrice = request.amount * 0.95;

      return { success: true, providerUsed: this.cheapDataHub.name, response, costPrice };
    } catch (primaryError: any) {
      console.warn(`[VtuEngine] Primary Provider (CheapDataHub) failed for DATA. Initiating FAILOVER to VTpass... Reason: ${primaryError.message}`);
      
      try {
        // 2. Failover: VTpass
        const response = await this.vtpass.buyData(request);
        const costPrice = request.amount;
        return { success: true, providerUsed: this.vtpass.name, response, costPrice };
      } catch (failoverError: any) {
        console.error(`[VtuEngine] CRITICAL: Both Primary and Failover providers failed for DATA.`, failoverError.message);
        throw new Error(`Data transaction failed across all providers. Primary: ${primaryError.message}. Failover: ${failoverError.message}`);
      }
    }
  }

  private async handleUtilityPurchase(request: BuyRequest) {
    try {
      // 1. Primary: VTpass
      const response = await this.vtpass.buyUtility(request);
      return { success: true, providerUsed: this.vtpass.name, response };
    } catch (error: any) {
      console.error(`[VtuEngine] Primary Provider (VTpass) failed for UTILITY. No failover available.`);
      throw new Error(`Utility transaction failed: ${error.message}`);
    }
  }
}
