import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export default function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Missing or malformed authorization token.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifies token securely against our validated environment secret
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Provided token is invalid or has expired.'
    });
  }
}