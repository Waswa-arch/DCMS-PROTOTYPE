import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure the baseline network endpoint address for the backend Express server
const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * STATE HYDRATION ENGINE:
     * On application boot, check if a valid profile session already 
     * exists inside local storage to prevent unnecessary logout resets.
     */
    const storedUser = localStorage.getItem('dcms_user');
    const storedToken = localStorage.getItem('dcms_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      // Bind token immediately to axios baseline configuration
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  /**
   * AXIOS SECURITY INTERCEPTOR CONFIGURATION:
   * Dynamically injects the Authorization bearer token into the headers
   * of every single outbound API call before it leaves the browser.
   */
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('dcms_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Global Session Login Hook
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      if (response.data.success) {
        const { token, user: profileData } = response.data;
        
        // Commit session state values to persistent hardware storage
        localStorage.setItem('dcms_token', token);
        localStorage.setItem('dcms_user', JSON.stringify(profileData));
        
        // Update live runtime tracking state variables
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(profileData);
        return { success: true, role: profileData.role };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'SERVER_CONNECTIVITY_ERROR',
        message: error.response?.data?.message || 'Unable to establish a link with the authentication server.'
      };
    }
  };

  // Global Session Logout Hook
  const logout = () => {
    localStorage.removeItem('dcms_token');
    localStorage.removeItem('dcms_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, apiUrl: API_URL }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom React component hook to allow instant access to auth states across views
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be invoked inside an explicitly declared AuthProvider wrap context.');
  }
  return context;
};