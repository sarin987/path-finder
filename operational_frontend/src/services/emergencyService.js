// services/emergencyService.js
import { db } from '../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export const emergencyTypes = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
};

export const createEmergencyRequest = async (data) => {
  try {
    const docRef = await addDoc(collection(db, 'emergency_requests'), {
      ...data,
      timestamp: new Date(),
      status: 'pending',
      priority: emergencyTypes[data.type] || emergencyTypes.MEDIUM,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating emergency request:', error);
    throw error;
  }
};

export const getNearbyServices = async (location, radius = 5) => {
  try {
    const services = await getDocs(collection(db, 'emergency_services'));
    return services.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(service =>
        calculateDistance(location, service.location) <= radius
      );
  } catch (error) {
    console.error('Error getting nearby services:', error);
    throw error;
  }
};

const calculateDistance = (location1, location2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (location2.latitude - location1.latitude) * Math.PI / 180;
  const dLon = (location2.longitude - location1.longitude) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(location1.latitude * Math.PI / 180) * Math.cos(location2.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// In emergencyService.js
export const startLocationTracking = async (userId, emergencyId) => {
  try {
    // Create a tracking session
    await addDoc(collection(db, 'location_tracking'), {
      userId,
      emergencyId,
      status: 'active',
      timestamp: new Date().toISOString(),
    });

    // Start tracking interval
    const trackLocation = async () => {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 }
        );
      });

      await addDoc(collection(db, 'location_updates'), {
        userId,
        emergencyId,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        },
        timestamp: new Date().toISOString(),
      });
    };

    // Track every 10 seconds
    setInterval(trackLocation, 10000);
  } catch (error) {
    console.error('Error starting location tracking:', error);
    throw error;
  }
};
