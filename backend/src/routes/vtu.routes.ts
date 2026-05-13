import { Router } from 'express';
import { purchaseService, getUserTransactions } from '../controllers/vtu.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/purchase', purchaseService);
router.get('/transactions', getUserTransactions);

export default router;
