import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * CLIENT-SIDE ROUTE GUARDIAN
 * Intercepts unauthorized navigation attempts and enforces explicit role clearance boundaries
 */
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  const location = useLocation();

  // 1. If no session data exists, throw them back to the login screen safely
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

 // 2. If roles are specified, ensure the user profile has appropriate institutional clearance
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    
    
    // Fallback safely to the main dashboard canvas where their native role layout handles rendering
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Clearance granted: render the requested visual dashboard layout subtree
  return children;
};