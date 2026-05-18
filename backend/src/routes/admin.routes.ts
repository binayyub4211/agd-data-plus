import { Router } from 'express';
import { 
  getAdminStats, 
  getAllUsers, 
  manualCreditUser, 
  generateMissingAccounts, 
  generateSingleAccount, 
  broadcastNotification, 
  deleteUser, 
  createSystemAlert, 
  deleteSystemAlert,
  adjustUserWallet,
  getAllTransactionsAdmin,
  getMarketAnalysis,
  updatePlanPriceSetting,
  getReferralsAdmin,
  rewardReferralAdmin
} from '../controllers/admin.controller';
import { updateSystemVersion } from '../controllers/version.controller';
import { protect } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';

const router = Router();

// All routes here require both Authentication AND Admin Role
router.use(protect);
router.use(isAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.post('/users/credit', manualCreditUser);
router.post('/users/adjust', adjustUserWallet);
router.get('/transactions', getAllTransactionsAdmin);
router.get('/market', getMarketAnalysis);
router.post('/pricing', updatePlanPriceSetting);
router.post('/accounts/regenerate', generateMissingAccounts);
router.post('/accounts/generate/:userId', generateSingleAccount);
router.get('/referrals', getReferralsAdmin);
router.post('/referrals/reward/:id', rewardReferralAdmin);
router.post('/broadcast', broadcastNotification);
router.post('/alert', createSystemAlert);
router.delete('/alert', deleteSystemAlert);
router.post('/version', updateSystemVersion);

export default router;
