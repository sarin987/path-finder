import React, { useEffect, useRef, useCallback } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { startLocationTracking, stopLocationTracking } from '../../services/responderLocationService';

const ResponderLocationTracker = ({ role, onLocationUpdate, children }) => {
  const watchId = useRef(null);
  const isMounted = useRef(true);

  // Request location permissions
  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to track your position.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          Alert.alert(
            'Location Permission Required',
            'This feature requires location permission to work properly.',
            [{ text: 'OK' }]
          );
          return false;
        }
      } catch (err) {
        console.warn('Error requesting location permission:', err);
        return false;
      }
    }
    return true; // For iOS, permissions are handled in Info.plist
  }, []);

  // Start tracking location
  const startTracking = useCallback(async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      const id = await startLocationTracking(role);
      if (isMounted.current) {
        watchId.current = id;
        console.log('Location tracking started');
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert(
        'Location Error',
        'Unable to start location tracking. Please ensure location services are enabled.',
        [{ text: 'OK' }]
      );
    }
  }, [role, requestLocationPermission]);

  // Stop tracking location
  const stopTracking = useCallback(async () => {
    try {
      if (watchId.current) {
        await stopLocationTracking();
        watchId.current = null;
        console.log('Location tracking stopped');
      }
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }, []);

  // Set up effect to start/stop tracking
  useEffect(() => {
    isMounted.current = true;
    
    if (role) {
      startTracking();
    }

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      stopTracking();
    };
  }, [role, startTracking, stopTracking]);

  // No UI to render, this is a container component
  return children || null;
};

export default React.memo(ResponderLocationTracker);
