import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const getBaseUrl = () => {
  if (__DEV__) {
    return Platform.select({
      ios: 'http://192.168.1.4:5000',
      android: DeviceInfo.isEmulatorSync() 
        ? 'http://10.0.2.2:5000' 
        : 'http://192.168.1.4:5000'  // Replace with your computer's local IP
    });
  }
  return 'https://your-production-api.com';
};

const BASE_URL = getBaseUrl();

export const API_ROUTES = {
  base: BASE_URL,
  auth: `${BASE_URL}/api/auth`,
  users: `${BASE_URL}/api/users`,
  services: `${BASE_URL}/api/services`
};

export const SOCKET_URL = BASE_URL;

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = '132352997002-191rb761r7moinacu45nn0iso7e7mf88.apps.googleusercontent.com';
