import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  USER_PROFILE: 'userProfile',
};

export const Storage = {
  async setItem(key, value) {
    try {
      if (!key || typeof key !== 'string') {
        throw new Error(`Invalid storage key: ${key}`);
      }

      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      console.log(`Stored ${key} successfully`);
    } catch (error) {
      console.error(`Storage error for ${key}:`, error);
      throw error;
    }
  },

  async getItem(key) {
    try {
      if (!key || typeof key !== 'string') {
        throw new Error(`Invalid storage key: ${key}`);
      }

      const value = await AsyncStorage.getItem(key);
      if (!value) {return null;}

      // Return token as is
      if (key === StorageKeys.USER_TOKEN) {
        return value;
      }

      // Parse other values
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    } catch (error) {
      console.error(`Storage error for ${key}:`, error);
      return null;
    }
  },

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
