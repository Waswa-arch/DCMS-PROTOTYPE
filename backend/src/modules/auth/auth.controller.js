import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../config/db.js';
import { env } from '../../config/env.js';

/**
 * SECURE USER REGISTRATION
 * Implements strict domain-based RBAC routing for institutional emails.
 */
export const register = async (req, res) => {
  const { id_number, name, password } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  if (!id_number || !name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are strictly required.' });
  }

  // 1. Domain-Based Role Mapping
  let role = 'STUDENT';
  let department_assigned_id = null;

  if (email.endsWith('@kabarak.edu.ke')) {
    role = 'OFFICER';
    try {
      // Officer's department is derived from a code in their staff ID
      // (e.g. "LIB/STAFF/001" -> LIB -> Library Services), not freely
      // chosen. This makes an officer's department assignment structural,
      // not just an admin's initial pick — the admin reassignment endpoint
      // still exists for genuine emergencies (see zero-officer-department
      // warning), but normal registration is now permanently tied to the
      // real department the staff ID represents.
      const prefixMatch = id_number.toUpperCase().match(/^([A-Z]+)/);
      const officerCode = prefixMatch ? prefixMatch[1] : null;

      const matchedDept = officerCode
        ? await db.get('SELECT id FROM departments WHERE officer_code = ?', [officerCode])
        : null;

      if (!matchedDept) {
        return res.status(400).json({
          success: false,
          message: 'Staff ID does not match any recognized department code. Contact administrator if you believe this is an error.'
        });
      }

      department_assigned_id = matchedDept.id;
    } catch (err) {
      console.error('Database Error during department lookup:', err);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  } else if (email.endsWith('@kabarak.ac.ke')) {
    role = 'STUDENT';
    department_assigned_id = null;
  } else {
    return res.status(400).json({ 
      success: false, 
      message: 'Registration denied: must use a valid Kabarak institutional email.' 
    });
  }

  try {
    // 2. Verify if the credentials conflict with an existing account
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

    // 3. Hash the user plaintext password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Persist the clean data record into the database
    await db.run(
      'INSERT INTO users (id_number, name, email, password_hash, role, department_assigned_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id_number, name, email, passwordHash, role, department_assigned_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered. You may now log in.'
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * SECURE USER LOGIN
 */
export const login = async (req, res) => {
  const { id_number, password } = req.body;

  if (!id_number || !password) {
    return res.status(400).json({ success: false, message: 'ID Number/Email and Password are required.' });
  }

  const cleanInput = id_number.trim().toLowerCase();

  try {
    const user = await db.get(
      'SELECT * FROM users WHERE LOWER(id_number) = ? OR LOWER(email) = ?', 
      [cleanInput, cleanInput] 
    );
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials.' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        id_number: user.id_number, 
        role: user.role,
        department_assigned_id: user.department_assigned_id 
      },
      env.jwtSecret,
      { expiresIn: '24h' }
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
        role: user.role,
        department_assigned_id: user.department_assigned_id
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};
/**
 * CHANGE OWN PASSWORD
 * Requires the current password to be re-entered and verified — never trust
 * a valid JWT alone to authorize a password change, since a stolen/still-live
 * token shouldn't be enough on its own to lock the real owner out.
 */
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are both required.'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters long.'
    });
  }

  try {
    const user = await db.get('SELECT password_hash FROM users WHERE id = ?', [userId]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change Password Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};