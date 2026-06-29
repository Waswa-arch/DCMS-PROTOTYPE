import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access Denied: Missing authentication token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    
    // Pass user context forward with explicit structural fields
    req.user = {
      id: decoded.id,
      id_number: decoded.id_number,
      role: decoded.role,
      department_assigned_id: decoded.department_assigned_id ?? null
    };

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Access Denied: Invalid or expired token.' });
  }
};

export default authenticate;