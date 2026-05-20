import { Router } from 'express';
import { purchaseService, getUserTransactions, getPlans, getServiceVariations } from '../controllers/vtu.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/purchase', purchaseService);
router.get('/transactions', getUserTransactions);
router.get('/plans', getPlans);
router.get('/variations/:serviceID', getServiceVariations);

export default router;

