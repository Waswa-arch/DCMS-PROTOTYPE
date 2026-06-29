import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnv = ['JWT_SECRET', 'PORT', 'ADMIN_PASSWORD'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', '🛑 CRITICAL CONFIGURATION ERROR:');
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('The application refuses to boot until these variables are configured inside your .env file.');
  process.exit(1);
}

export const env = {
  jwtSecret: process.env.JWT_SECRET,
  port: parseInt(process.env.PORT, 10),
  adminPassword: process.env.ADMIN_PASSWORD,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};