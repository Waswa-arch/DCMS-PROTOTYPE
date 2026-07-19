import express from 'express';
import { register, login, changePassword } from './auth.controller.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

// Publicly Exposed Security Authentication Endpoints
router.post('/register', register);
router.post('/login', login);

// Requires a valid session — user must already be authenticated to change their own password
router.post('/change-password', authenticate, changePassword);

export default router;