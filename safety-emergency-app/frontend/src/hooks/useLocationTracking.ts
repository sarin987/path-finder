import { useState, useEffect, useCallback } from 'react';
import { startLocationTracking } from '../services/locationService';

export const useLocationTracking = (token: string, role: string) => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Start tracking location
  const startTracking = useCallback(() => {
    if (!token || !role) {
      setError('Missing token or role');
      return () => {};
    }

    setIsTracking(true);
    setError(null);

    // Start tracking and get cleanup function
    const stopTracking = startLocationTracking(
      token,
      role,
      (location) => {
        setCurrentLocation(location);
      }
    );

    // Return cleanup function to stop tracking
    return () => {
      stopTracking();
      setIsTracking(false);
    };
  }, [token, role]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Any cleanup if needed
    };
  }, []);

  return {
    currentLocation,
    error,
    isTracking,
    startTracking,
  };
};

export default useLocationTracking;
