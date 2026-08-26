import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
});

apiClient.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
