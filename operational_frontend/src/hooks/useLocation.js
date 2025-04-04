import { useState, useEffect } from 'react';
import Geolocation from '@react-native-community/geolocation';

export const useLocation = (initialLocation) => {
  const [location, setLocation] = useState(initialLocation);

  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      position => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      },
      error => console.error('Location error:', error),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );

    return () => Geolocation.clearWatch(watchId);
  }, []);

  return { location, setLocation };
};