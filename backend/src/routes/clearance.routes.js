import { Router } from 'express';
import { initiateClearance, getStudentClearanceStatus } from '../controllers/clearance.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js'; // Ensure you import your JWT shield middleware

const router = Router();

// Secure both operations behind your JWT token verification shield
router.post('/initiate', verifyToken, initiateClearance);
router.get('/status', verifyToken, getStudentClearanceStatus);

export default router;