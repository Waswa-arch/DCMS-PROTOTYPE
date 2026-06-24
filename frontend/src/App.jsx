import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';

// 🚀 Pulling directly from your actual, existing visual files!
import Login from './views/Login';
import Register from './views/Register';
import DashboardLayout from './layouts/DashboardLayout';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. PUBLIC AUTHENTICATION ZONE (Guards against signed-in users backtracking) */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          {/* Uniform alias handling for signup links */}
          <Route path="/signup" element={<Navigate to="/register" replace />} />

          {/* 2. PROTECTED WORKSPACE ZONE (Enforces global session verification) */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['STUDENT', 'OFFICER', 'ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          } />

          {/* 3. AUTOMATIC FALLBACK ROOT INTERCEPTOR */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}