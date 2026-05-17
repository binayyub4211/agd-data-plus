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
      const oldBalance = await this.cheapDataHub.checkBalance();
      const response = await this.cheapDataHub.buyAirtime(request);
      const newBalance = await this.cheapDataHub.checkBalance();
      const costPrice = (oldBalance > 0 && newBalance >= 0) ? (oldBalance - newBalance) : null;
      
      // If costPrice is exactly 0, CheapDataHub silently refunded it
      if (costPrice === 0) {
        console.error(`[VtuEngine] CheapDataHub silently refunded Airtime! Balances matched: ${oldBalance}`);
        throw new Error('Provider rejected or refunded transaction silently');
      }

      return { success: true, providerUsed: this.cheapDataHub.name, response, costPrice };
    } catch (primaryError: any) {
      console.warn(`[VtuEngine] Primary Provider (CheapDataHub) failed for Airtime. Initiating FAILOVER to VTpass...`);
      
      // Temporarily disabling VTpass failover because it is using a dummy mock that returns Success!
      // This forces the backend to instantly catch CheapDataHub errors and refund the user.
      throw new Error(`Primary Provider (CheapDataHub) failed: ${primaryError.message}. (VTpass failover disabled)`);
      
      /*
      try {
        // 2. Failover: VTpass
        const response = await this.vtpass.buyAirtime(request);
        return { success: true, providerUsed: this.vtpass.name, response };
      } catch (failoverError: any) {
        console.error(`[VtuEngine] CRITICAL: Both providers failed for AIRTIME.`);
        throw new Error('Airtime purchase failed across all providers.');
      }
      */
    }
  }

  private async handleDataPurchase(request: BuyRequest) {
    try {
      // 1. Primary: CheapDataHub
      const oldBalance = await this.cheapDataHub.checkBalance();
      const response = await this.cheapDataHub.buyData(request);
      const newBalance = await this.cheapDataHub.checkBalance();
      const costPrice = (oldBalance > 0 && newBalance >= 0) ? (oldBalance - newBalance) : null;
      
      // If costPrice is exactly 0, CheapDataHub silently refunded it
      if (costPrice === 0) {
        console.error(`[VtuEngine] CheapDataHub silently refunded Data! Balances matched: ${oldBalance}`);
        throw new Error('Provider rejected or refunded transaction silently');
      }

      return { success: true, providerUsed: this.cheapDataHub.name, response, costPrice };
    } catch (primaryError: any) {
      console.warn(`[VtuEngine] Primary Provider (CheapDataHub) failed. Initiating FAILOVER to VTpass... Reason: ${primaryError.message}`);
      
      // Temporarily disabling VTpass failover because it is using a dummy mock that returns Success!
      // This forces the backend to instantly catch CheapDataHub errors and refund the user.
      throw new Error(`Primary Provider (CheapDataHub) failed: ${primaryError.message}. (VTpass failover disabled)`);

      /*
      try {
        // 2. Failover: VTpass
        const response = await this.vtpass.buyData(request);
        return { success: true, providerUsed: this.vtpass.name, response };
      } catch (failoverError: any) {
        console.error(`[VtuEngine] CRITICAL: Both Primary and Failover providers failed for DATA.`);
        throw new Error('Transaction failed across all providers.');
      }
      */
    }
  }

  private async handleUtilityPurchase(request: BuyRequest) {
    try {
      // 1. Primary: VTpass
      const response = await this.vtpass.buyUtility(request);
      return { success: true, providerUsed: this.vtpass.name, response };
    } catch (error: any) {
      console.error(`[VtuEngine] Primary Provider (VTpass) failed for UTILITY. No failover available.`);
      throw new Error('Utility transaction failed.');
    }
  }
}
