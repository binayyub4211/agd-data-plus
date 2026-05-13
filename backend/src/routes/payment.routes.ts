import { Router } from 'express';
import { initializeFunding, verifyFunding } from '../controllers/payment.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/initialize', initializeFunding);
router.get('/verify/:reference', verifyFunding);

export default router;
