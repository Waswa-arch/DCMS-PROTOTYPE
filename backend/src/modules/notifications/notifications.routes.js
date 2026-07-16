import { Router } from 'express';
import { getMyNotifications, markNotificationRead } from './notifications.controller.js';
import authenticate from '../../middleware/authenticate.js';

const router = Router();

// No role restriction — every authenticated role has their own notifications.
router.get('/me', authenticate, getMyNotifications);
router.patch('/:id/read', authenticate, markNotificationRead);

export default router;