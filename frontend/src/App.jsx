import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './views/Login';
import Register from './views/Register';
import { ProtectedRoute } from './routes/ProtectedRoute';
import {PublicRoute} from './routes/PublicRoute';
import StudentDashboard from './pages/student/StudentDashboard';
import OfficerDashboard from './pages/officer/OfficerDashboard';

// Inline Admin Placeholder
const AdminDashboard = () => <div>Admin Dashboard (Placeholder)</div>;

const DashboardOrchestrator = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'STUDENT': return <StudentDashboard />;
    case 'OFFICER': return <OfficerDashboard />;
    case 'ADMIN': return <AdminDashboard />;
    default: return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardOrchestrator />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;