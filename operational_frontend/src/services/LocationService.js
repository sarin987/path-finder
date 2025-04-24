import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

class LocationService {
  constructor() {
    this.watchId = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Configure Geolocation globally
      if (Platform.OS === 'ios') {
        await Geolocation.requestAuthorization();
      }

      await Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: 'whenInUse',
        enableBackgroundLocationUpdates: false,
      });

      // Check if location services are enabled
      const position = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          pos => resolve(pos),
          error => reject(error),
          { 
            timeout: 5000,
            maximumAge: 0,
            enableHighAccuracy: false 
          }
        );
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Location initialization error:', error);
      throw new Error('Location services are not available. Please enable GPS and try again.');
    }
  }

  async checkAndRequestPermissions() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (Platform.OS === 'android') {
      try {
        const fineLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const coarseLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );

        return (
          fineLocation === PermissionsAndroid.RESULTS.GRANTED ||
          coarseLocation === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.error('Permission check error:', err);
        return false;
      }
    }
    return true;
  }

  async getCurrentPosition() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const hasPermission = await this.checkAndRequestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          position => {
            console.log('Position received:', position);
            resolve(position);
          },
          error => {
            console.error('Geolocation error:', error);
            if (error.code === 2) {
              reject(new Error('Please enable GPS and try again'));
            } else {
              reject(error);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      });
    } catch (error) {
      console.error('Get current position error:', error);
      throw error;
    }
  }

  startTracking(callback) {
    try {
      this.watchId = Geolocation.watchPosition(
        callback,
        error => console.error('Location tracking error:', error),
        {
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 5000,
          fastestInterval: 2000,
          useSignificantChanges: false,
        }
      );
    } catch (error) {
      console.error('Start tracking error:', error);
      throw error;
    }
  }

  stopTracking() {
    try {
      if (this.watchId !== null) {
        Geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }
    } catch (error) {
      console.error('Stop tracking error:', error);
    }
  }
}

// Create and initialize the service
const locationService = new LocationService();

// Export an already initialized instance
export { locationService };