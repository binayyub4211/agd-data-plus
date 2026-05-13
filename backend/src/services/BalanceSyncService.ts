import cron from 'node-cron';
import { Provider } from '../types/prisma';
import { PrismaClient } from '@prisma/client';
import { CheapDataHubProvider } from './providers/CheapDataHubProvider';
import { VTpassProvider } from './providers/VTpassProvider';

const prisma = new PrismaClient();
const cheapDataHub = new CheapDataHubProvider();
const vtpass = new VTpassProvider();

export class BalanceSyncService {
  /**
   * Initializes the cron job to run every 10 minutes.
   */
  public start() {
    console.log('[BalanceSyncService] Initializing 10-minute balance cron job...');
    
    // Run every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
      console.log('[BalanceSyncService] Running scheduled balance sync...');
      await this.syncBalances();
    });
  }

  private async syncBalances() {
    try {
      // Fetch balances concurrently
      const [cdhBalance, vtpassBalance] = await Promise.allSettled([
        cheapDataHub.checkBalance(),
        vtpass.checkBalance()
      ]);

      // Update CheapDataHub
      if (cdhBalance.status === 'fulfilled') {
        await prisma.providerBalance.upsert({
          where: { provider: Provider.CHEAP_DATA_HUB },
          update: { balance: cdhBalance.value },
          create: { provider: Provider.CHEAP_DATA_HUB, balance: cdhBalance.value }
        });
        console.log(`[BalanceSyncService] CheapDataHub updated: ₦${cdhBalance.value}`);
      } else {
        console.error(`[BalanceSyncService] CheapDataHub sync failed:`, cdhBalance.reason);
      }

      // Update VTpass
      if (vtpassBalance.status === 'fulfilled') {
        await prisma.providerBalance.upsert({
          where: { provider: Provider.VTPASS },
          update: { balance: vtpassBalance.value },
          create: { provider: Provider.VTPASS, balance: vtpassBalance.value }
        });
        console.log(`[BalanceSyncService] VTpass updated: ₦${vtpassBalance.value}`);
      } else {
        console.error(`[BalanceSyncService] VTpass sync failed:`, vtpassBalance.reason);
      }

    } catch (error) {
      console.error('[BalanceSyncService] Critical failure during balance sync:', error);
    }
  }
}
