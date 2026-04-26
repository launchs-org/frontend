import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/app';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  // /auth/me specifically uses refresh_token, others use access_token
  const isMeEndpoint = config.url === '/auth/me' || config.url?.endsWith('/auth/me');
  const tokenKey = isMeEndpoint ? 'refresh_token' : 'access_token';
  const token = localStorage.getItem(tokenKey);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // Redirect to root or reload to trigger auth check in App.tsx
      window.location.href = '/ui/';
    }
    return Promise.reject(error);
  }
);

export default api;
