import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';

// 1. Import your secured ES Module routers
import authRoutes from './routes/auth.routes.js';
import clearanceRoutes from './routes/clearance.routes.js';

// Load environment variables from .env file
dotenv.config();

const app = express();

// 2. Global Middleware Configuration
app.use(cors()); // CRITICAL: Allows your React frontend to make Axios network requests to this API
app.use(express.json()); // Parses incoming JSON payloads automatically

// 3. Mount System API Endpoint Routers
app.use('/api/auth', authRoutes);
app.use('/api/clearance', clearanceRoutes);

// Fallback route for server status verification
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ONLINE', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

// 4. Initialize Database Connection Pool prior to firing up the network listener
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`[Server Core] DCMS Backend Operational.`);
    console.log(`[Server Core] Mode: ES Modules (ESM)`);
    console.log(`[Server Core] Listening securely on: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
  });
}).catch(err => {
  console.error('\n[Server Core] CRITICAL BOOT ERROR: Database engine pool failure.');
  console.error(err);
  process.exit(1);
});