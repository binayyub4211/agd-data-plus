import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(protect);

router.put('/settings', userController.updateSettings);
router.put('/password', userController.updatePassword);
router.put('/email', userController.updateEmail);

export default router;
