import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/app';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let refreshPromise: Promise<any> | null = null;

// Request interceptor to add JWT token
api.interceptors.request.use(async (config) => {
  // /auth/me and /auth/token specifically use refresh_token, others use access_token
  const isAuthEndpoint = config.url === '/auth/me' || config.url === '/auth/token' || 
                         config.url?.endsWith('/auth/me') || config.url?.endsWith('/auth/token');
  
  if (isAuthEndpoint) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      config.headers.Authorization = `Bearer ${refreshToken}`;
    }
    return config;
  }

  // Check if access token is expired or missing
  const lastFetched = parseInt(localStorage.getItem('access_token_timestamp') || '0');
  const now = Date.now();
  
  if (!localStorage.getItem('access_token') || (now - lastFetched > CACHE_DURATION)) {
    if (!refreshPromise) {
      refreshPromise = api.get('/auth/token').finally(() => { refreshPromise = null; });
    }
    try {
      await refreshPromise;
    } catch (e) {
      // Refresh failed, will be handled by 401 logic if needed
    }
  }

  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => {
    // If this was a token refresh call, save the new access token
    const isTokenEndpoint = response.config.url === '/auth/token' || response.config.url?.endsWith('/auth/token');
    if (isTokenEndpoint && response.data?.token) {
      localStorage.setItem('access_token', response.data.token);
      localStorage.setItem('access_token_timestamp', Date.now().toString());
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('access_token_timestamp');
      // Redirect to root or reload to trigger auth check in App.tsx
      window.location.href = '/ui/';
    }
    return Promise.reject(error);
  }
);

export default api;
