import app from './app';
import { config } from './config/config';
import { BalanceSyncService } from './services/BalanceSyncService';
import { exec } from 'child_process';

const PORT = config.PORT || 5000;

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT} in ${config.NODE_ENV} mode.`);
  
  // Programmatic DB Self-Healing Migration on boot
  exec('npx prisma generate && npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Prisma Migration Failure: ${error.message}`);
      return;
    }
    console.log(`✅ Prisma DB Synced Successfully:\n${stdout}`);
  });

  // Start automated jobs
  const balanceSync = new BalanceSyncService();
  balanceSync.start();
});
