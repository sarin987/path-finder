import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
import { offlineQueue } from './offlineQueue';

export const initializeBackgroundLocation = (userId) => {
  BackgroundGeolocation.configure({
    desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
    stationaryRadius: 50,
    distanceFilter: 50,
    notificationTitle: 'Background tracking',
    notificationText: 'Enabled',
    debug: __DEV__,
    startOnBoot: false,
    stopOnTerminate: true,
    locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
    interval: 10000,
    fastestInterval: 5000,
    activitiesInterval: 10000,
    stopOnStillActivity: false
  });

  BackgroundGeolocation.on('location', async (location) => {
    const locationUpdate = {
      type: 'UPDATE_LOCATION',
      payload: {
        userId,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString()
      }
    };

    try {
      await offlineQueue.addToQueue(locationUpdate);
      await offlineQueue.processQueue();
    } catch (error) {
      console.error('Background location error:', error);
    }
  });

  BackgroundGeolocation.start();
};