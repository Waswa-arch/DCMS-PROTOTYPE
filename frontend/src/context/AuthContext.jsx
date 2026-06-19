import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// 1. CONFIGURE A CENTRALIZED AXIOS INSTANCE
export const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// AUTOMATIC ROUTE GUARD INTERCEPTOR:
// Injects the cryptographic JWT token into the Authorization header of every single outbound request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dcms_auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  // Safe initialization for the active backend-authenticated user session
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('active_clearance_session');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.warn("Corrupted session discovered. Wiping entry...");
      localStorage.removeItem('active_clearance_session');
      localStorage.removeItem('dcms_auth_token');
      return null;
    }
  });

  // State hook to bridge real-time data streaming to your dashboard view components
  const [clearanceRecords, setClearanceRecords] = useState([]);

  // AUTOMATIC SESSION SYNC INTERCEPTOR:
  // Detects token expiration or unauthenticated server responses and forces a clean logout
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.warn("[Security Context] Token invalid or expired. Terminating session context.");
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  /**
   * IDENTITY PROVISIONING NETWORK DISPATCH
   * Connects registration form actions directly to our live Express server backend
   */
  const register = async ({ firstName, lastName, email, password, regNumber = '' }) => {
    try {
      const payload = {
        name: `${firstName} ${lastName}`.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        id_number: regNumber.trim() // Maps React inputs cleanly onto database columns
      };

      // Dispatches request directly to the secure backend router
      const response = await api.post('/api/auth/register', payload);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Registration gateway refused transaction.";
      throw new Error(errorMessage);
    }
  };

  /**
   * SECURE TOKEN HANDSHAKE DISPATCH
   * Exchanges plaintext login credentials for signed cryptographic session keys
   */
  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password: password,
      });

      const { token, user: authenticatedUser } = response.data;

      // Persist token and session context safely within browser memory line
      localStorage.setItem('dcms_auth_token', token);
      localStorage.setItem('active_clearance_session', JSON.stringify(authenticatedUser));
      
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Secure gateway rejected authentication mapping.";
      throw new Error(errorMessage);
    }
  };

  /**
   * RE-FETCH REALTIME STUDENT TRACKING STATUS MAP
   * Queries the clearance ledger directly to replace legacy local state tables
   */
  const refreshClearanceData = async () => {
    try {
      const response = await api.get('/api/clearance/me');
      if (response.data && response.data.departmental_status) {
        setClearanceRecords(response.data.departmental_status);
        return response.data;
      }
    } catch (error) {
      console.error("Failed to sync structural clearance map records from the server pool:", error);
    }
  };

  /**
   * OFFICER ADMINISTRATIVE ACTION BRIDGE
   * Dispatches workflow choices directly to the database via specific node IDs
   */
  const updateClearanceStatus = async (itemId, newStatus, remarks = '') => {
    try {
      const response = await api.post(`/api/clearance/item/${itemId}/action`, {
        status: newStatus,
        remarks: remarks
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Server refused clearance administrative update.";
      throw new Error(errorMessage);
    }
  };

  /**
   * CRYPTOGRAPHIC SESSION TERMINATION
   * Drops session states and safely flushes local memory rows
   */
  const logout = () => {
    setUser(null);
    setClearanceRecords([]);
    localStorage.removeItem('dcms_auth_token');
    localStorage.removeItem('active_clearance_session');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      clearanceRecords, 
      refreshClearanceData,
      updateClearanceStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be called from directly inside an active <AuthProvider> rendering layout wrapper node.");
  }
  return context;
};