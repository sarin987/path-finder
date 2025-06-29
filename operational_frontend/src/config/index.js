import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// Environment detection
const isDevelopment = __DEV__;

// Base URL configuration
const getBaseUrl = () => {
  // Always use the specified IP for all environments
  return 'http://192.168.14.111:5000';
};

export const BASE_URL = getBaseUrl();

// API Version - Set to /api to match backend routes
export const API_VERSION = '/api';

// Log final configuration
console.log('API Configuration:', {
  BASE_URL,
  API_VERSION,
  isDevelopment,
  platform: Platform.OS,
  isEmulator: DeviceInfo.isEmulatorSync()
});

// API Endpoints
export const API_ROUTES = {
  // Base
  base: BASE_URL,
  
  // Auth
  auth: {
    login: `${BASE_URL}${API_VERSION}/auth/login`,
    register: `${BASE_URL}${API_VERSION}/auth/register`,
    refreshToken: `${BASE_URL}${API_VERSION}/auth/refresh-token`,
    sendOtp: `${BASE_URL}${API_VERSION}/auth/send-otp`,
    verifyOtp: `${BASE_URL}${API_VERSION}/auth/verify-otp`,
    forgotPassword: `${BASE_URL}${API_VERSION}/auth/forgot-password`,
    resetPassword: `${BASE_URL}${API_VERSION}/auth/reset-password`,
    google: `${BASE_URL}${API_VERSION}/auth/google`,
    facebook: `${BASE_URL}${API_VERSION}/auth/facebook`,
    apple: `${BASE_URL}${API_VERSION}/auth/apple`,
    logout: `${BASE_URL}${API_VERSION}/auth/logout`,
  },
  
  // Users
  users: {
    profile: `${BASE_URL}${API_VERSION}/users/me`,
    updateProfile: `${BASE_URL}${API_VERSION}/users/me`,
    changePassword: `${BASE_URL}${API_VERSION}/users/change-password`,
    uploadAvatar: `${BASE_URL}${API_VERSION}/users/avatar`,
    emergencyContacts: `${BASE_URL}${API_VERSION}/users/emergency-contacts`,
    preferences: `${BASE_URL}${API_VERSION}/users/preferences`,
  },
  
  // Services
  services: {
    list: `${BASE_URL}${API_VERSION}/services`,
    categories: `${BASE_URL}${API_VERSION}/services/categories`,
  },
  
  // Emergency
  emergency: {
    report: `${BASE_URL}${API_VERSION}/emergency/report`,
    active: `${BASE_URL}${API_VERSION}/emergency/active`,
    history: `${BASE_URL}${API_VERSION}/emergency/history`,
    cancel: (id) => `${BASE_URL}${API_VERSION}/emergency/${id}/cancel`,
  },
  
  // Locations
  locations: {
    nearby: `${BASE_URL}${API_VERSION}/locations/nearby`,
    search: `${BASE_URL}${API_VERSION}/locations/search`,
  },
  
  // Notifications
  notifications: {
    list: `${BASE_URL}${API_VERSION}/notifications`,
    read: (id) => `${BASE_URL}${API_VERSION}/notifications/${id}/read`,
    readAll: `${BASE_URL}${API_VERSION}/notifications/read-all`,
  },
};

// WebSocket Configuration
export const SOCKET_CONFIG = {
  url: isDevelopment ? 'ws://192.168.14.111:5000' : 'wss://your-production-api.com',
  options: {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  },
  events: {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
    LOCATION_UPDATE: 'location_update',
    EMERGENCY_ALERT: 'emergency_alert',
    MESSAGE: 'message',
  },
};

// OAuth Configuration
export const OAUTH_CONFIG = {
  google: {
    clientId: '132352997002-191rb761r7moinacu45nn0iso7e7mf88.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  },
  facebook: {
    appId: 'YOUR_FACEBOOK_APP_ID',
    permissions: ['public_profile', 'email'],
  },
  apple: {
    // Apple Sign In configuration
  },
};

// App Configuration
export const APP_CONFIG = {
  name: 'Emergency Safety App',
  version: '1.0.0',
  environment: isDevelopment ? 'development' : 'production',
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
  defaultCoordinates: {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
};

// Feature Flags
export const FEATURE_FLAGS = {
  enablePushNotifications: true,
  enableBiometricAuth: true,
  enableOfflineMode: true,
  enableAnalytics: !isDevelopment,
};

// Export all configs
export default {
  API_ROUTES,
  SOCKET_CONFIG,
  OAUTH_CONFIG,
  APP_CONFIG,
  FEATURE_FLAGS,
  isDevelopment,
  BASE_URL,
};
