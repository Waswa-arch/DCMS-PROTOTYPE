import express from 'express';
import cors from 'cors';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import clearanceRoutes from './modules/clearance/clearance.routes.js'; // 🆕 Import Clearance Router

const app = express();

// Global Request Pipeline Middleware
app.use(cors());
app.use(express.json());

// ROUTE MOUNTING
app.use('/api/auth', authRoutes);
app.use('/api/clearance', clearanceRoutes); // 🆕 Mount Clearance Endpoints

// API Base Root Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'DCMS Engine Core Online.' });
});

// Centralized Catch-All Error Boundary Interceptor
app.use(errorHandler);

export default app;