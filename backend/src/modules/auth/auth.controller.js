import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../config/db.js';
import { env } from '../../config/env.js';

/**
 * SECURE USER REGISTRATION
 * Forces all public signups to 'STUDENT' status to prevent exploit injections
 */
export const register = async (req, res, next) => {
  const { id_number, name, email, password } = req.body;

  if (!id_number || !name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are strictly required.' });
  }

  try {
    // 1. Verify if the credentials conflict with an existing account
    const existingUser = await db.get(
      'SELECT id FROM users WHERE id_number = ? OR email = ?',
      [id_number, email]
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this ID Number or Email already exists.'
      });
    }

    // 2. Hash the user plaintext password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Persist the clean data record into the database (Always forcing STUDENT role)
    await db.run(
      'INSERT INTO users (id_number, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [id_number, name, email, passwordHash, 'STUDENT']
    );

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered. You may now log in.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SECURE USER LOGIN
 * Verifies credentials across roles and signs an encrypted application JWT token
 */
export const login = async (req, res, next) => {
  const { id_number, password } = req.body;

  if (!id_number || !password) {
    return res.status(400).json({ success: false, message: 'ID Number/Email and Password are required.' });
  }

  // 1. Bulletproof the input: removed accidental spaces and force to lowercase
  // Safely placed AFTER we confirm id_number actually exists
  const cleanInput = id_number.trim().toLowerCase();

  // 🔴 DEBUG LOG 1
  console.log(`📥 [LOGIN ATTEMPT] Typed: "${id_number}" -> Cleaned: "${cleanInput}"`);

  try {
    // 2. Retrieve user context (Case-insensitive search for BOTH ID and Email)
    const user = await db.get(
      'SELECT * FROM users WHERE LOWER(id_number) = ? OR LOWER(email) = ?', 
      [cleanInput, cleanInput] 
    );
    
    // 🔴 DEBUG LOG 2: Did the database find the user?
    console.log("🔍 [DB SEARCH] User found:", user ? user.name : "NO MATCH FOUND");

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials.' });
    }

    // 3. Compare incoming passphrase against the hashed binary representation
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    // 🔴 DEBUG LOG 3: Did the passwords match?
    console.log("🔐 [PASSWORD CHECK] Hash matched:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials.' });
    }

    // 4. Issue a tamper-proof cryptographic JWT session token
    const token = jwt.sign(
      { id: user.id, id_number: user.id_number, role: user.role },
      env.jwtSecret,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        id_number: user.id_number,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};