// Web polyfill for AsyncStorage using localStorage
const AsyncStorage = {
  getItem: async (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const value = window.localStorage.getItem(key);
        return value;
      }
      return null;
    } catch (error) {
      console.error('AsyncStorage.getItem error:', error);
      return null;
    }
  },

  setItem: async (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (error) {
      console.error('AsyncStorage.setItem error:', error);
      throw error;
    }
  },

  removeItem: async (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (error) {
      console.error('AsyncStorage.removeItem error:', error);
      throw error;
    }
  },

  multiGet: async (keys) => {
    try {
      const result = [];
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        result.push([key, value]);
      }
      return result;
    } catch (error) {
      console.error('AsyncStorage.multiGet error:', error);
      throw error;
    }
  },

  multiSet: async (keyValuePairs) => {
    try {
      for (const [key, value] of keyValuePairs) {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('AsyncStorage.multiSet error:', error);
      throw error;
    }
  },

  multiRemove: async (keys) => {
    try {
      for (const key of keys) {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('AsyncStorage.multiRemove error:', error);
      throw error;
    }
  },

  clear: async () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
        return;
      }
    } catch (error) {
      console.error('AsyncStorage.clear error:', error);
      throw error;
    }
  },

  getAllKeys: async () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          keys.push(window.localStorage.key(i));
        }
        return keys;
      }
      return [];
    } catch (error) {
      console.error('AsyncStorage.getAllKeys error:', error);
      return [];
    }
  },
};

export default AsyncStorage;
