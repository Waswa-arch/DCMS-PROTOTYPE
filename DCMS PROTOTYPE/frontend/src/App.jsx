import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/Login.jsx';
import Register from './views/Register.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Access Hubs */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Institutional Operations Routing Frame */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all Fallback Gateway */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;