import { Router } from 'express';
import { verifyNinSlip } from '../controllers/nin.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/verify', verifyNinSlip);

export default router;
