import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import bcrypt from 'bcryptjs';
// Initialize configuration environment paths from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS) for local frontend environments
app.use(cors());

// Configure application-level middleware to parse incoming JSON payloads
app.use(express.json());

// Link the authentication system routing maps
app.use('/api/auth', authRoutes);

// Diagnostic health-check endpoint to verify network availability
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ONLINE', 
    system: 'Digital Clearance Management System Backend',
    databaseEnforced: true,
    timestamp: new Date()
  });
});

// Wraps server boot to guarantee database connectivity before accepting traffic
async function startServer() {
  try {
    // 1. Initialize our clean pure-javascript SQLite driver async framework
    await initDB();
    
    // 2. Open up the network listener gateway
    app.listen(PORT, () => {
      console.log(`[Express Server] Server running in [${process.env.NODE_ENV || 'development'}] mode.`);
      console.log(`Security Server online: Operational on port ${PORT}`);
      console.log(`[Express Server] API listening for traffic at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('CRITICAL FAULT: Failed to initialize server architecture:', error);
    process.exit(1); // Kill process on critical startup error
  }
}

// Fire up the unified system engine
startServer();