import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

router.use(protect);

router.get('/alert/active', notificationController.getActiveSystemAlert);
router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.post('/:id/reply', notificationController.replyToNotification);

export default router;
