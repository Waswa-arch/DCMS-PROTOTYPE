import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './views/Login';
import Register from './views/Register';
import DashboardLayout from './components/DashboardLayout';

const MainApplicationRoutingGate = () => {
  const { user } = useAuth();
  const [currentUrlPath, setCurrentUrlPath] = useState(window.location.pathname);

  useEffect(() => {
    const syncLocationRoute = () => setCurrentUrlPath(window.location.pathname);
    window.addEventListener('popstate', syncLocationRoute);
    return () => window.removeEventListener('popstate', syncLocationRoute);
  }, []);

  const navigateToPage = (targetPath) => {
    window.history.pushState({}, '', targetPath);
    setCurrentUrlPath(targetPath);
  };

  // 1️⃣ PRIORITIZE EXPLICIT PATH MATCHING FIRST (Fixes the Officer Dashboard hijacking)
  if (currentUrlPath === '/register' || currentUrlPath === '/signup') {
    return <Register onNavigate={navigateToPage} />;
  }

  // 2️⃣ IF NO USER SESSION EXISTS, FORCE THE LOGIN SCREEN
  if (!user) {
    return <Login onNavigate={navigateToPage} />;
  }

  // 3️⃣ DEFAULT FALLBACK FOR AUTHENTICATED USERS
  return <DashboardLayout onNavigate={navigateToPage} />;
};

function App() {
  return (
    <AuthProvider>
      <MainApplicationRoutingGate />
    </AuthProvider>
  );
}

export default App;