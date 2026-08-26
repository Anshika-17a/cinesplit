import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

// Hardcoded production URL — bypasses any Vercel dashboard env var placeholders
const PRODUCTION_API_URL = 'https://cinesplit-backend.onrender.com/api';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // Only use env var if it's a real URL (not placeholder or empty)
  if (
    envUrl &&
    envUrl.includes('://') &&
    !envUrl.includes('<') &&
    !envUrl.includes('your-backend')
  ) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
  }
  // In dev, use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  return PRODUCTION_API_URL;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
});

apiClient.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuth.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
