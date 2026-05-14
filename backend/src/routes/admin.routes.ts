import { Router } from 'express';
import { getAdminStats, getAllUsers, manualCreditUser, generateMissingAccounts } from '../controllers/admin.controller';
import { protect } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';

const router = Router();

// All routes here require both Authentication AND Admin Role
router.use(protect);
router.use(isAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.post('/users/credit', manualCreditUser);
router.post('/accounts/regenerate', generateMissingAccounts);

export default router;
