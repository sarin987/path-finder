import { BASE_URL, API_VERSION } from './index';

// API Configuration
const API_CONFIG = {
  // Base URLs
  BASE_URL: `${BASE_URL}${API_VERSION}`,
  WS_URL: BASE_URL.replace('http', 'ws'), // Convert http to ws

  // API Version
  VERSION: 'v1',

  // Timeout settings (in milliseconds)
  TIMEOUT: 30000, // 30 seconds

  // Headers
  getHeaders: (token = '') => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Add this to bypass ngrok browser warning
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  }),

  // WebSocket configuration
  WS_RECONNECT_INTERVAL: 5000, // 5 seconds
  WS_MAX_RETRIES: 5,
};

export const API_URL = API_CONFIG.BASE_URL;
export const WS_URL = API_CONFIG.WS_URL;

export default API_CONFIG;
