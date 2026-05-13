import { Router } from 'express';
import { login, register, refresh, setup2FA, verify2FA, getProfile, getNotifications, markNotificationAsRead, getReferrals } from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimiter';
import { protect } from '../middleware/auth.middleware';

const router = Router(); // Auth Router

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);

// Protected routes
router.use(protect);
router.get('/me', getProfile);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationAsRead);
router.post('/2fa/setup', setup2FA);
router.post('/2fa/verify', verify2FA);
router.get('/referrals', getReferrals);

export default router;
