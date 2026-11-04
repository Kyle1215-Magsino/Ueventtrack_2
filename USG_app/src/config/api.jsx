import axios from 'axios';

// IMPORTANT: Update this to match your backend server IP address
// Find your computer's IP address:
// - Windows: Run 'ipconfig' in Command Prompt, look for IPv4 Address
// - Mac/Linux: Run 'ifconfig' in Terminal, look for inet address
// - Make sure your phone and computer are on the same WiFi network
// - Your Laravel backend should be running on port 8000
export const API_BASE_URL = 'http://10.54.162.26:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;
