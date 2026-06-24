import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api'; 

const AuthContext = createContext(null);

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

  // AUTOMATIC SESSION SYNC INTERCEPTOR
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
   * High-fidelity mapping ensures multi-step fields (role, department) are safely preserved
   */
  const register = async (formData) => {
    try {
      // 1. Resolve name variations (handles both single 'name' input or split 'firstName/lastName')
      const resolvedName = formData.name || formData.fullName || 
        `${formData.firstName || ''} ${formData.lastName || ''}`.trim();

      // 2. Resolve registration number field variations
      const clearRegNumber = formData.regNumber || formData.idNumber || formData.id_number || formData.studentId || '';

      // 3. Assemble unified payload carrying custom form metrics (role, school, department)
      const payload = {
        ...formData, 
        name: resolvedName,
        email: (formData.email || '').trim().toLowerCase(),
        password: formData.password,
        id_number: clearRegNumber.trim()
      };

      console.log("📡 [Auth Context] Dispatching Registration Payload:", payload);

      const response = await api.post('/auth/register', payload);
      return response.data;
    } catch (error) {
      console.error("❌ [Auth Context] Registration Endpoint Rejection:", error.response?.data);
      const errorMessage = error.response?.data?.message || "Registration gateway refused transaction.";
      throw new Error(errorMessage);
    }
  };

  /**
   * SECURE TOKEN HANDSHAKE DISPATCH
   * Dual-property assignment satisfies both loose and strict identification schemas
   */
  const login = async (idNumberOrEmail, password) => {
    try {
      const cleanedIdentifier = idNumberOrEmail.trim();
      
      // Build an adaptive payload to support backends reading either key
      const payload = { 
        id_number: cleanedIdentifier,
        password: password 
      };

      if (cleanedIdentifier.includes('@')) {
        payload.email = cleanedIdentifier.toLowerCase();
      }

      console.log("📡 [Auth Context] Dispatching Login Payload:", payload);

      const response = await api.post('/auth/login', payload);
      const { token, user: authenticatedUser } = response.data;

      // Persist token and session context safely within browser memory line
      localStorage.setItem('dcms_auth_token', token);
      localStorage.setItem('active_clearance_session', JSON.stringify(authenticatedUser));
      
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (error) {
      console.error("❌ [Auth Context] Login Endpoint Rejection:", error.response?.data);
      const errorMessage = error.response?.data?.message || "Secure gateway rejected authentication mapping.";
      throw new Error(errorMessage);
    }
  };

  /**
   * RE-FETCH REALTIME STUDENT TRACKING STATUS MAP
   */
  const refreshClearanceData = async () => {
    try {
      const response = await api.get('/clearance/me');
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
   */
  const updateClearanceStatus = async (itemId, newStatus, remarks = '') => {
    try {
      const response = await api.post(`/clearance/item/${itemId}/action`, {
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