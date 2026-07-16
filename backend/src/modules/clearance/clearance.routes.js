import { Router } from 'express';
import { getMyClearance, getOfficerQueue, actionClearanceItem, resubmitClearanceItem } from './clearance.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';

const router = Router();

// Routes use array syntax for authorize to match authorize.js parameter style
router.get('/me', authenticate, authorize(['STUDENT']), getMyClearance);
router.get('/officer/queue', authenticate, authorize(['OFFICER', 'ADMIN']), getOfficerQueue);
router.post('/item/:id/action', authenticate, authorize(['OFFICER', 'ADMIN']), actionClearanceItem);
router.post('/item/:id/resubmit', authenticate, authorize(['STUDENT']), resubmitClearanceItem);
export default router;