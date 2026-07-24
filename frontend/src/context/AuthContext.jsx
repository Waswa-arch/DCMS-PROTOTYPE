import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
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

  const [clearanceRecords, setClearanceRecords] = useState([]);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const register = async (formData) => {
    try {
      const resolvedName = formData.name || formData.fullName ||
        `${formData.firstName || ''} ${formData.lastName || ''}`.trim();

      const clearRegNumber = formData.regNumber || formData.idNumber || 
        formData.id_number || formData.studentId || '';

      const payload = {
        ...formData,
        name: resolvedName,
        email: (formData.email || '').trim().toLowerCase(),
        password: formData.password,
        id_number: clearRegNumber.trim()
      };

      const response = await api.post('/auth/register', payload);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        "Registration gateway refused transaction.";
      throw new Error(errorMessage);
    }
  };

  const login = async (idNumberOrEmail, password) => {
    try {
      const cleanedIdentifier = idNumberOrEmail.trim();

      // "identifier" matches the backend's field name — it accepts EITHER
      // an ID number or an email, matched against both columns server-side.
      // The old conditional email-field logic here was dead code: the
      // backend never read a separate "email" field, only "id_number".
      const payload = {
        identifier: cleanedIdentifier,
        password: password
      };

      const response = await api.post('/auth/login', payload);
      const { token, user: authenticatedUser } = response.data;

      localStorage.setItem('dcms_auth_token', token);
      localStorage.setItem('active_clearance_session', JSON.stringify(authenticatedUser));

      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        "Secure gateway rejected authentication mapping.";
      throw new Error(errorMessage);
    }
  };

  const refreshClearanceData = async () => {
    try {
      const response = await api.get('/clearance/me');
      if (response.data?.departmental_status) {
        setClearanceRecords(response.data.departmental_status);
        return response.data;
      }
    } catch (error) {
      console.error("Failed to sync clearance records:", error);
    }
  };

  const updateClearanceStatus = async (itemId, newStatus, remarks = '') => {
    try {
      const response = await api.post(`/clearance/item/${itemId}/action`, {
        status: newStatus,
        remarks
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        "Server refused clearance administrative update.";
      throw new Error(errorMessage);
    }
  };

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
    throw new Error("useAuth must be called inside an <AuthProvider>.");
  }
  return context;
};