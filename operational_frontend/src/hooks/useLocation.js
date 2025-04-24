import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export const useLocation = (defaultLocation) => {
  const [location, setLocation] = useState(defaultLocation);
  const [error, setError] = useState(null);

  const updateLocation = async (newLocation) => {
    try {
      setLocation(newLocation);
    } catch (error) {
      console.error('Location update error:', error);
      setError(error);
    }
  };

  return {
    location,
    setLocation: updateLocation,
    error
  };
};