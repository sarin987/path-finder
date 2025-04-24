import { useState, useEffect } from 'react';
import { Platform, AppState, PermissionsAndroid } from 'react-native';
import { PERMISSIONS, check, request, RESULTS } from 'react-native-permissions';

export const usePermissions = () => {
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const checkPermissions = async () => {
    if (AppState.currentState !== 'active') {
      return false;
    }

    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        setPermissionStatus(result);
        return result;
      }
      return true;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  };

  const requestPermissions = async () => {
    if (AppState.currentState !== 'active' || isRequesting) {
      return false;
    }

    try {
      setIsRequesting(true);

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        setPermissionStatus(granted === PermissionsAndroid.RESULTS.GRANTED);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPermissions();
      }
    });

    checkPermissions();

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    permissionStatus,
    checkPermissions,
    requestPermissions,
    isRequesting
  };
};