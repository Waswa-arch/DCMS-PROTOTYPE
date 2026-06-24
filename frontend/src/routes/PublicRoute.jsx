import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * REVERSE PUBLIC GUARD
 * Automatically forwards authenticated users away from landing/login panels straight into their workspaces
 */
export const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  // Inside frontend/src/routes/PublicRoute.jsx...

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};