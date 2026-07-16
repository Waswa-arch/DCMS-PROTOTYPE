import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import clearanceRoutes from './modules/clearance/clearance.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import errorHandler from './middleware/errorHandler.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';

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

app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;