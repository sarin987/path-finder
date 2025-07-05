import { useState, useCallback } from 'react';
import Geolocation from '@react-native-community/geolocation';

export default function useUserLocation() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

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
                if (pos) resolve(pos);
                else reject(new Error('No last known position available'));
              },
              (err) => reject(err),
              { timeout: 5000 }
            );
          });
        } catch (error) {
          lastError = error;
        }
      }
      if (!position) throw lastError || new Error('Unable to get location after multiple attempts');
      if (!position.coords) throw new Error('No location data received');
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