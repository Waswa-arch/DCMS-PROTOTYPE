import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

const router = express.Router();

/**
 * IDENTITY PROVISIONING ENDPOINT
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  // HARMONIZATION: Read both camelCase and snake_case registration keys to stay resilient
  const { name, email, password } = req.body;
  const id_number = req.body.id_number || req.body.idNumber;

  if (!name || !email || !id_number || !password) {
    return res.status(400).json({ success: false, message: 'Missing required registration parameters.' });
  }

  // SECURITY LOCKDOWN FIX: Public endpoints must strictly produce STUDENT accounts.
  // Officer/Admin creation is isolated to a secure, gated configuration router later.
  const role = 'STUDENT';

  try {
    // COLUMN FIX: Querying against the correct snake_case column layout
    const existingUser = await db.get('SELECT * FROM users WHERE email = ? OR id_number = ?', [email, id_number]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Identity Conflict: Registration parameters already indexed.' });
    }

    // Hash access credentials with standard salt rounds
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // COLUMN FIX: Writing to the standardized database columns (password_hash, id_number)
    await db.run(
      'INSERT INTO users (name, email, password_hash, role, id_number) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, id_number]
    );

    return res.status(201).json({ success: true, message: 'Institutional registration sequence verified.' });
  } catch (error) {
    console.error('Registration Layer Fault:', error);
    return res.status(500).json({ success: false, message: 'Server transactional refusal. Unable to compile profile.' });
  }
});

/**
 * SECURE TOKEN HANDSHAKE GATEWAY
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Missing login credentials.' });
  }

  // SECURITY FIX: Crash loudly or reject handshake if environment JWT secret is unconfigured
  if (!process.env.JWT_SECRET) {
    console.error('[CRITICAL SECURITY ERROR] JWT_SECRET environment variable is completely missing.');
    return res.status(500).json({ success: false, message: 'Cryptographic core error. Session generation offline.' });
  }

  try {
    // Look for the identity entry by institutional email
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Access Denied: Invalid identity parameters.' });
    }

    // COLUMN FIX: Validate against password_hash instead of the legacy non-existent column
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Access Denied: Secure credential verification failed.' });
    }

    // SECURITY FIX: Removed the public fallback string to prevent arbitrary signature forging
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, id_number: user.id_number },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return authorization parameters back to our frontend receptor
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        // Compiling backward-compatibility hooks so old frontend code won't immediately break
        id_number: user.id_number,
        idNumber: user.id_number 
      }
    });
  } catch (error) {
    console.error('Login Layer Fault:', error);
    return res.status(500).json({ success: false, message: 'Server system degradation. Secure gateway offline.' });
  }
});

export default router;