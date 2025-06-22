import axios from 'axios';

const apiClient = axios.create({
  // Use relative paths so '/api/...' is proxied in development; set VITE_API_URL in production
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
});

// Log cookie header on each request
apiClient.interceptors.request.use(config => {
  console.log('[apiClient] Sending request to', config.url, 'with cookies:', document.cookie);
  return config;
});

export default apiClient;
