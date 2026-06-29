import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';

// 🚀 Core View Pages
import Login from './views/Login';
import Register from './views/Register';
import OfficerDashboard from './pages/officer/OfficerDashboard';

// A temporary inline component to route users to the correct dashboard based on role
const DashboardOrchestrator = () => {
  const { user } = useAuth();

  if (user?.role === 'OFFICER') {
    return <OfficerDashboard />;
  }

  // Fallback for students until Step 3 is complete
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center max-w-sm">
        <p className="text-xs font-bold text-slate-700 mb-2">Student Dashboard Slot</p>
        <p className="text-[11px] text-slate-400">The Student Dashboard connection is currently being mapped.</p>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. PUBLIC AUTHENTICATION ZONE */}
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
          <Route path="/signup" element={<Navigate to="/register" replace />} />

          {/* 2. PROTECTED WORKSPACE ZONE */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['STUDENT', 'OFFICER', 'ADMIN']}>
              <DashboardOrchestrator />
            </ProtectedRoute>
          } />

          {/* 3. AUTOMATIC FALLBACK ROOT INTERCEPTOR */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}