import { Router } from 'express';
import { getSystemVersion } from '../controllers/version.controller';

const router = Router();

// Public system check
router.get('/version', getSystemVersion);

export default router;
