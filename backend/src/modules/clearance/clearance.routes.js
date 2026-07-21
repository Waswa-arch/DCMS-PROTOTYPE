import { Router } from 'express';
import { getMyClearance, getOfficerQueue, getOfficerStats, getOfficerHistory, getApprovedStudents, actionClearanceItem, resubmitClearanceItem } from './clearance.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';

const router = Router();

// Routes use array syntax for authorize to match authorize.js parameter style
router.get('/me', authenticate, authorize(['STUDENT']), getMyClearance);
router.get('/officer/queue', authenticate, authorize(['OFFICER', 'ADMIN']), getOfficerQueue);
router.get('/officer/stats', authenticate, authorize(['OFFICER', 'ADMIN']), getOfficerStats);
router.get('/officer/history', authenticate, authorize(['OFFICER', 'ADMIN']), getOfficerHistory);
router.get('/approved-students', authenticate, authorize(['OFFICER', 'ADMIN']), getApprovedStudents);
router.post('/item/:id/action', authenticate, authorize(['OFFICER', 'ADMIN']), actionClearanceItem);
router.post('/item/:id/resubmit', authenticate, authorize(['STUDENT']), resubmitClearanceItem);
export default router;