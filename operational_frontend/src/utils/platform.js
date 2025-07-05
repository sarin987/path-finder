import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

// Platform-specific imports
export const getPermissionsAndroid = () => {
  if (isWeb) {
    return require('./web-polyfills/PermissionsAndroid').default;
  } else {
    const { PermissionsAndroid } = require('react-native');
    return PermissionsAndroid;
  }
};

export const getToastAndroid = () => {
  if (isWeb) {
    return require('./web-polyfills/ToastAndroid').default;
  } else {
    const { ToastAndroid } = require('react-native');
    return ToastAndroid;
  }
};

export const getAsyncStorage = () => {
  if (isWeb) {
    return require('./web-polyfills/AsyncStorage').default;
  } else {
    return require('@react-native-async-storage/async-storage').default;
  }
};

// Geolocation service
export const getGeolocation = () => {
  if (isWeb) {
    return {
      getCurrentPosition: (success, error, options) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(success, error, options);
        } else {
          error({ code: 1, message: 'Geolocation not supported' });
        }
      },
      watchPosition: (success, error, options) => {
        if (navigator.geolocation) {
          return navigator.geolocation.watchPosition(success, error, options);
        } else {
          error({ code: 1, message: 'Geolocation not supported' });
          return null;
        }
      },
      clearWatch: (watchId) => {
        if (navigator.geolocation && watchId) {
          navigator.geolocation.clearWatch(watchId);
        }
      }
    };
  } else {
    const Geolocation = require('@react-native-community/geolocation');
    return Geolocation;
  }
};
