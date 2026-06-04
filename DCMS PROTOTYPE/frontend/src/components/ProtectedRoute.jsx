import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * APPLICATION ROUTING ACCESS GUARD:
 * Intercepts page transition actions, evaluates active authentication state 
 * from the central context, and blocks unauthorized route traversal.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  // 1. If the user is completely unauthenticated, redirect them to the login screen
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If specific roles are required, check if the logged-in user possesses clearance
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If unauthorized, fallback route based on their actual role assignment
    if (user.role === 'STUDENT') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (user.role === 'OFFICER') {
      return <Navigate to="/officer/dashboard" replace />;
    } else if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // 3. User is authorized for this branch. Render the requested child page view components.
  return children;
};

export default ProtectedRoute;