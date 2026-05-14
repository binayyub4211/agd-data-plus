import app from './app';
import { config } from './config/config';
import { BalanceSyncService } from './services/BalanceSyncService';

const PORT = config.PORT || 5000;

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT} in ${config.NODE_ENV} mode.`);
  
  // Start automated jobs
  const balanceSync = new BalanceSyncService();
  balanceSync.start();
});
