import express from 'express';
import { getMyClearance, actionClearanceItem } from './clearance.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';

const router = express.Router();

// Student-facing route: Access personal clearance tracks or auto-initialize missing ledgers
router.get('/me', authenticate, authorize(['STUDENT']), getMyClearance);

// Officer & Admin route: Fast-track, approve, or flag individual department steps
router.post('/item/:id/action', authenticate, authorize(['OFFICER', 'ADMIN']), actionClearanceItem);

export default router;