import axios from 'axios';

// Initialize a unified network manager instance pointing directly to our backend engine
const client = axios.create({
  baseURL: 'http://localhost:5001/api', // Aligned perfectly with our active backend port mapping
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR: Automatically appends the security token to authenticated pipelines
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dcms_token'); // Safe retrieval token slot
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Automatically intercepts auth failures (e.g., token expiration)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && [401, 403].includes(error.response.status)) {
      console.warn('[Network Core] Session validation failure. Flushing local session profiles.');
      localStorage.removeItem('dcms_token');
      localStorage.removeItem('dcms_user');
      // If the user isn't already on the login track, bounce them back to it safely
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;