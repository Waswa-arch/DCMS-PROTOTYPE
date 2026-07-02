import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach the token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dcms_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;

});