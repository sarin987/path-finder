import { Platform, Alert as RNAlert, ToastAndroid } from 'react-native';

/**
 * Safely shows an alert or falls back to console in non-browser environments
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Array} buttons - Array of button configurations (optional)
 */
const alert = (title, message, buttons) => {
  try {
    // In a React Native environment
    if (typeof RNAlert.alert === 'function') {
      RNAlert.alert(title, message, buttons || [{ text: 'OK' }]);
    } 
    // In a web environment
    else if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n\n${message}`);
    }
    // Fallback to console
    else {
      console.log(`[ALERT] ${title}: ${message}`);
    }
  } catch (error) {
    console.error('Error showing alert:', error);
  }
};

/**
 * Shows a toast message (Android) or alert (iOS/Web)
 * @param {string} message - Message to show
 * @param {'SHORT' | 'LONG'} duration - Duration of the toast (Android only)
 */
const toast = (message, duration = 'SHORT') => {
  try {
    if (Platform.OS === 'android' && ToastAndroid) {
      ToastAndroid.show(
        message,
        duration === 'LONG' ? ToastAndroid.LONG : ToastAndroid.SHORT
      );
    } else {
      alert('', message);
    }
  } catch (error) {
    console.error('Error showing toast:', error);
  }
};

export { alert, toast };

export default {
  alert,
  toast
};
