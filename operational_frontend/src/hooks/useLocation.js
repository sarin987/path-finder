import { useState, useEffect, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export const useLocation = (defaultLocation) => {
  const [location, setLocation] = useState(defaultLocation);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Request permission (Android)
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        setError('Permission error');
        return false;
      }
    }
    return true;
  };

  // Fetch current location
  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      setError('Location permission denied');
      setLoading(false);
      return;
    }
    Geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Unable to get location');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  }, []);

  useEffect(() => {
    fetchLocation();
    // Optionally, return a cleanup function if you want to clear watch
  }, [fetchLocation]);

  // Allow manual refresh
  const refresh = () => fetchLocation();

  return {
    location,
    setLocation,
    error,
    loading,
    refresh,
  };
};
