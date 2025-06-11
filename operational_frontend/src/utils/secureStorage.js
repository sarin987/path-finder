import EncryptedStorage from 'react-native-encrypted-storage';

const secureStorage = {
  // Store data securely
  setItem: async (key, value) => {
    try {
      await EncryptedStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
      return false;
    }
  },

  // Retrieve data securely
  getItem: async (key) => {
    try {
      const value = await EncryptedStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  },

  // Remove data
  removeItem: async (key) => {
    try {
      await EncryptedStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('SecureStorage removeItem error:', error);
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
  }
};

export default secureStorage;
