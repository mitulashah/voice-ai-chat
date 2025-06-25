import axios from 'axios';

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

export default apiClient;
