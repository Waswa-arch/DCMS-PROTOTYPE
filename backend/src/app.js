import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import clearanceRoutes from './modules/clearance/clearance.routes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors({
  origin: env.frontendUrl,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clearance', clearanceRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;