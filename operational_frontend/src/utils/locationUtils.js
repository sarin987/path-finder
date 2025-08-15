import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

/**
 * Requests location permission from the user
 * @returns {Promise<boolean>} Whether the permission was granted
 */
export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to show nearby responders.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      return false;
    }
  } else if (Platform.OS === 'ios') {
    // For iOS, permissions are handled in Info.plist
    // You need to add NSLocationWhenInUseUsageDescription and NSLocationAlwaysAndWhenInUseUsageDescription
    return true;
  }

  return false;
};

/**
 * Gets the current device location
 * @param {Object} options - Geolocation options
 * @returns {Promise<Object>} Object with latitude and longitude
 */
export const getCurrentLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
      ...options,
    };

    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        reject(error);
      },
      defaultOptions
    );
  });
};

/**
 * Watches the device location and calls the callback with updates
 * @param {Function} callback - Callback function that receives location updates
 * @param {Object} options - Geolocation options
 * @returns {number} Watch ID that can be used to clear the watch
 */
export const watchLocation = (callback, options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: true,
    distanceFilter: 10, // Minimum distance (in meters) between updates
    interval: 5000, // Minimum time (in milliseconds) between updates
    fastestInterval: 2000, // Fastest interval (in milliseconds) that updates may be received
    ...options,
  };

  return Geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      console.error('Error watching location:', error);
    },
    defaultOptions
  );
};

/**
 * Stops watching the device location
 * @param {number} watchId - The watch ID returned by watchLocation
 */
export const stopWatchingLocation = (watchId) => {
  if (watchId != null) {
    Geolocation.clearWatch(watchId);
  }
};

/**
 * Calculates the distance between two coordinates in meters
 * Uses the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Formats a distance in meters to a human-readable string
 * @param {number} distanceInMeters - Distance in meters
 * @returns {string} Formatted distance string (e.g., "1.2 km" or "850 m")
 */
export const formatDistance = (distanceInMeters) => {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} m`;
  }
  return `${(distanceInMeters / 1000).toFixed(1)} km`;
};

/**
 * Gets the compass direction from a bearing in degrees
 * @param {number} bearing - Bearing in degrees (0-360)
 * @returns {string} Compass direction (e.g., "N", "NE", "E", etc.)
 */
export const getCompassDirection = (bearing) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((bearing %= 360) < 0 ? bearing + 360 : bearing) / 22.5) % 16;
  return directions[index];
};

/**
 * Gets the approximate time to reach a destination
 * @param {number} distanceInMeters - Distance in meters
 * @param {number} speedInKph - Speed in kilometers per hour
 * @returns {string} Formatted time string (e.g., "5 min", "2 h 30 min")
 */
export const getTimeToDestination = (distanceInMeters, speedInKph = 5) => {
  // Convert speed from km/h to m/s
  const speedInMps = (speedInKph * 1000) / 3600;
  const seconds = distanceInMeters / speedInMps;

  if (seconds < 60) {
    return 'Less than a minute';
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
};
