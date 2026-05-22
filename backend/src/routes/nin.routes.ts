import { Router } from 'express';
import { verifyNinSlip, getNinHistory, downloadNinSlip } from '../controllers/nin.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/verify', verifyNinSlip);
router.get('/history', getNinHistory);
router.get('/download/:id', downloadNinSlip);

export default router;
