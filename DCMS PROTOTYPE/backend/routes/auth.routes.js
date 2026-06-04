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
  const { name, email, idNumber, password, role } = req.body;

  try {
    // 1. Check if the user already exists in our relational state engine
    const existingUser = await db.get('SELECT * FROM users WHERE email = ? OR idNumber = ?', [email, idNumber]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Identity Conflict: Registration parameters already indexed.' });
    }

    // 2. Hash the access credential with a solid salt factor
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Inject the clean profile records into the SQLite engine safely using structured parameters
    await db.run(
      'INSERT INTO users (name, email, idNumber, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, idNumber, hashedPassword, role || 'STUDENT']
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

  try {
    // 1. Look for the identity entry by institutional email
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Access Denied: Invalid identity parameters.' });
    }

    // 2. Perform a cryptographic match check on the password payload
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Access Denied: Secure credential verification failed.' });
    }

    // 3. Generate a signed JSON Web Token session stamp
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'KABARAK_SUPER_SECRET_SIGNING_KEY_2026',
      { expiresIn: '24h' }
    );

    // 4. Return authorization parameters to our frontend Axios receptor
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        idNumber: user.idNumber,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Layer Fault:', error);
    return res.status(500).json({ success: false, message: 'Server system degradation. Secure gateway offline.' });
  }
});

export default router;