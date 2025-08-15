import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform, AppState, NativeEventEmitter, NativeModules } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { throttle } from 'lodash';

// Location update strategies
const LOCATION_STRATEGIES = {
  HIGH_ACCURACY: {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
    distanceFilter: 10, // meters
    interval: 10000, // 10 seconds
  },
  BALANCED: {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: 30000,
    distanceFilter: 30, // meters
    interval: 30000, // 30 seconds
  },
  LOW_POWER: {
    enableHighAccuracy: false,
    timeout: 20000,
    maximumAge: 60000,
    distanceFilter: 100, // meters
    interval: 60000, // 1 minute
  },
};

export default function useUserLocation() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [locationPermission, setLocationPermission] = useState(null);
  const watchIdRef = useRef(null);
  const lastLocationRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const strategyRef = useRef(LOCATION_STRATEGIES.HIGH_ACCURACY);

  // Throttled location update function
  const updateLocation = useCallback(throttle((location) => {
    setUserLocation(location);
    lastLocationRef.current = location;
  }, 5000, { leading: true, trailing: false }), []);

  // Check and request location permissions
  const checkLocationPermission = useCallback(async () => {
    try {
      let permission;
      if (Platform.OS === 'android') {
        permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      } else {
        permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      }

      const status = await check(permission);
      setLocationPermission(status);

      if (status === RESULTS.DENIED) {
        const requestStatus = await request(permission);
        setLocationPermission(requestStatus);
        return requestStatus === RESULTS.GRANTED;
      }

      return status === RESULTS.GRANTED;
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        await startWatchingLocation();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        stopWatchingLocation();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      stopWatchingLocation();
    };
  }, []);

  // Stop watching location
  const stopWatchingLocation = useCallback(() => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Start watching location with appropriate strategy
  const startWatchingLocation = useCallback(async () => {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      setLocationError('Location permission not granted');
      return;
    }

    stopWatchingLocation();

    const strategy = batteryLevel < 0.2 ?
      LOCATION_STRATEGIES.LOW_POWER :
      batteryLevel < 0.5 ?
      LOCATION_STRATEGIES.BALANCED :
      LOCATION_STRATEGIES.HIGH_ACCURACY;

    strategyRef.current = strategy;

    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed,
          heading: position.coords.heading,
          altitude: position.coords.altitude,
        };
        updateLocation(location);
      },
      (error) => {
        console.error('Location error:', error);
        setLocationError(error.message);
      },
      strategy
    );
  }, [batteryLevel, checkLocationPermission, stopWatchingLocation, updateLocation]);

  // Multi-strategy geolocation
  const getLocation = useCallback(async () => {
    setLoading(true);
    setLocationError(null);
    setUserLocation(null);
    try {
      if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
        throw new Error('Geolocation is not available on this device.');
      }
      const tryGetLocation = (options, attempt = 1) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`Location request timed out (attempt ${attempt})`));
          }, options.timeout || 10000);
          Geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeoutId);
              resolve(pos);
            },
            (err) => {
              clearTimeout(timeoutId);
              reject(err);
            },
            options
          );
        });
      };
      let position = null;
      let lastError = null;
      // Strategy 1: High accuracy
      try {
        position = await tryGetLocation({ enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }, 1);
      } catch (error) {
        lastError = error;
      }
      // Strategy 2: Lower accuracy
      if (!position) {
        try {
          position = await tryGetLocation({ enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }, 2);
        } catch (error) {
          lastError = error;
        }
      }
      // Strategy 3: Last known position
      if (!position && Geolocation.getLastKnownPosition) {
        try {
          position = await new Promise((resolve, reject) => {
            Geolocation.getLastKnownPosition(
              (pos) => {
                if (pos) {resolve(pos);}
                else {reject(new Error('No last known position available'));}
              },
              (err) => reject(err),
              { timeout: 5000 }
            );
          });
        } catch (error) {
          lastError = error;
        }
      }
      if (!position) {throw lastError || new Error('Unable to get location after multiple attempts');}
      if (!position.coords) {throw new Error('No location data received');}
      const lat = Number(position.coords.latitude);
      const lng = Number(position.coords.longitude);
      if (typeof lat === 'number' && isFinite(lat) && typeof lng === 'number' && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        setUserLocation({ latitude: lat, longitude: lng });
      } else {
        throw new Error('Invalid coordinates received from location service.');
      }
    } catch (error) {
      let errorMessage = 'Unable to get your location.';
      if (error.code === 1) {
        errorMessage = 'Location permission denied. Please enable location permissions in your device settings.';
      } else if (error.code === 2) {
        errorMessage = 'Location service unavailable. Please check if location services are enabled on your device.';
      } else if (error.code === 3 || error.message?.includes('timeout')) {
        errorMessage = 'Location request timed out. Please try again in an open area with better GPS signal.';
      } else {
        errorMessage = error?.message || errorMessage;
      }
      setLocationError(errorMessage);
      setUserLocation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual location setter
  const setManualLocation = useCallback((lat, lng) => {
    setUserLocation({ latitude: lat, longitude: lng });
    setLocationError(null);
    setShowManualInput(false);
  }, []);

  // Retry function
  const retry = useCallback(() => {
    getLocation();
  }, [getLocation]);

  return {
    userLocation,
    locationError,
    loading,
    retry,
    showManualInput,
    setShowManualInput,
    setManualLocation,
    manualLat,
    manualLng,
    setManualLat,
    setManualLng,
  };
}
