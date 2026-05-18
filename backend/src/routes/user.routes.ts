import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import * as userController from '../controllers/user.controller';
import * as pinController from '../controllers/pin.controller';

const router = Router();

router.use(protect);

router.put('/settings', userController.updateSettings);
router.put('/password', userController.updatePassword);
router.put('/email', userController.updateEmail);
router.post('/generate-accounts', userController.generateAccounts);

// Transaction PIN routes
router.post('/pin/set', pinController.setTransactionPin);
router.post('/pin/verify', pinController.verifyTransactionPin);
router.get('/pin/configured', pinController.checkPinConfigured);
router.post('/pin/reset', pinController.resetTransactionPin);

export default router;
