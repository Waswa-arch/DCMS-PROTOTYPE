import axios from 'axios';

// 1. CONFIGURE CENTRALIZED AXIOS INSTANCE (Targeting our live backend port 5001)
export const api = axios.create({
  baseURL: 'http://localhost:5001/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// AUTOMATIC ROUTE GUARD INTERCEPTOR
// Injects the cryptographic JWT token into the Authorization header of every outbound request
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