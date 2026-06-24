import express from 'express';
import { register, login } from './auth.controller.js';

const router = express.Router();

// Publicly Exposed Security Authentication Endpoints
router.post('/register', register);
router.post('/login', login);

export default router;