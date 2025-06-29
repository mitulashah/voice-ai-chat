import axios from 'axios';
import { getItem, setItem } from '../utils/localStorage';

// Runtime configuration from window.ENV (loaded from /config.js)
declare global {
  interface Window {
    ENV: {
      VITE_API_URL: string;
    };
  }
}

const getApiBaseUrl = () => {
  // Priority: runtime config > build-time env > empty (for local dev with proxy)
  return window.ENV?.VITE_API_URL || import.meta.env.VITE_API_URL || '';
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

// Log cookie header on each request
apiClient.interceptors.request.use(config => {
  console.log('[apiClient] Sending request to', config.url, 'with cookies:', document.cookie);
  console.log('[apiClient] Base URL:', getApiBaseUrl());
  return config;
});

// Attach x-session-id header from stored sessionId (fallback if cookie isn't stored)
apiClient.interceptors.request.use(config => {
  // Use localStorage utility for sessionId
  const sessionId = getItem<string>('sessionId');
  if (sessionId) {
    config.headers = config.headers || {};
    config.headers['x-session-id'] = sessionId;
  }
  return config;
});

// On login response, store sessionId for future headers
apiClient.interceptors.response.use(response => {
  if (response.config.url?.endsWith('/api/auth/login') && response.data?.sessionId) {
    setItem('sessionId', response.data.sessionId);
    apiClient.defaults.headers.common['x-session-id'] = response.data.sessionId;
  }
  return response;
});

export default apiClient;
