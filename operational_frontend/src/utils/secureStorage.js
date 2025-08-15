import EncryptedStorage from 'react-native-encrypted-storage';

// Storage keys
const KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  REFRESH_TOKEN: 'refreshToken',
};

// Helper function to safely stringify values
const safeStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Stringify error:', error);
    return '{}';
  }
};

// Helper function to safely parse JSON
const safeParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Parse error:', error);
    return null;
  }
};

const secureStorage = {
  KEYS,

  // Store data securely
  setItem: async (key, value) => {
    try {
      await EncryptedStorage.setItem(key, safeStringify(value));
      return true;
    } catch (error) {
      console.error(`SecureStorage setItem error for key "${key}":`, error);
      return false;
    }
  },

  // Retrieve data securely
  getItem: async (key) => {
    try {
      const value = await EncryptedStorage.getItem(key);
      return safeParse(value);
    } catch (error) {
      console.error(`SecureStorage getItem error for key "${key}":`, error);
      return null;
    }
  },

  // Remove data
  removeItem: async (key) => {
    try {
      await EncryptedStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`SecureStorage removeItem error for key "${key}":`, error);
      return false;
    }
  },

  // Clear all data
  clear: async () => {
    try {
      await EncryptedStorage.clear();
      return true;
    } catch (error) {
      console.error('SecureStorage clear error:', error);
      return false;
    }
  },

  // JWT Token specific methods
  setToken: async (token) => {
    return secureStorage.setItem(KEYS.USER_TOKEN, token);
  },

  getToken: async () => {
    return secureStorage.getItem(KEYS.USER_TOKEN);
  },

  setRefreshToken: async (refreshToken) => {
    return secureStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
  },

  getRefreshToken: async () => {
    return secureStorage.getItem(KEYS.REFRESH_TOKEN);
  },

  setUserData: async (userData) => {
    return secureStorage.setItem(KEYS.USER_DATA, userData);
  },

  getUserData: async () => {
    return secureStorage.getItem(KEYS.USER_DATA);
  },

  // Clear all auth related data
  clearAuthData: async () => {
    try {
      await Promise.all([
        secureStorage.removeItem(KEYS.USER_TOKEN),
        secureStorage.removeItem(KEYS.USER_DATA),
        secureStorage.removeItem(KEYS.REFRESH_TOKEN),
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing auth data:', error);
      return false;
    }
  },
};

export default secureStorage;
