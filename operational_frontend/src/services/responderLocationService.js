import { db, auth } from '../config/firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';

// Track the current responder's location
export const startLocationTracking = async (role) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const responderId = user.uid;

  // Set initial status
  await updateResponderStatus({
    role,
    status: 'available',
    online: true,
    lastSeen: serverTimestamp(),
  }, responderId);

  // Set up disconnect handler
  const responderRef = doc(db, 'responders', responderId);

  // This will run when the client disconnects
  await setDoc(responderRef, {
    online: false,
    status: 'offline',
    lastSeen: serverTimestamp(),
  }, { merge: true });

  // Start watching position
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => handlePositionUpdate(position, role, responderId, resolve, reject),
      (error) => handlePositionError(error, reject),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

// Stop tracking location
export const stopLocationTracking = async () => {
  const user = auth.currentUser;
  if (!user) {return;}

  const responderId = user.uid;
  const responderRef = doc(db, 'responders', responderId);

  await setDoc(responderRef, {
    online: false,
    status: 'offline',
    lastSeen: serverTimestamp(),
  }, { merge: true });
};

// Update responder's status in Firestore
const updateResponderStatus = async (data, responderId) => {
  const responderRef = doc(db, 'responders', responderId);

  await setDoc(responderRef, {
    ...data,
    updatedAt: serverTimestamp(),
    userId: responderId,
  }, { merge: true });
};

// Handle position updates
const handlePositionUpdate = async (position, role, responderId, resolve, reject) => {
  const { latitude, longitude, accuracy } = position.coords;

  try {
    await updateResponderStatus({
      latitude,
      longitude,
      accuracy,
      role,
      online: true,
      lastSeen: serverTimestamp(),
    }, responderId);

    // Start watching position after initial update
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
        await updateResponderStatus({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          online: true,
          lastSeen: serverTimestamp(),
        }, responderId);
      },
      handlePositionError,
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update when moved at least 10 meters
        maximumAge: 5000,
      }
    );

    resolve(watchId);
  } catch (error) {
    console.error('Error updating location:', error);
    reject(error);
  }
};

// Handle position errors
const handlePositionError = (error, reject) => {
  console.error('Error getting location:', error);
  if (reject) {reject(error);}
};

// Subscribe to nearby responders
export const subscribeToNearbyResponders = (center, radiusInKm, onRespondersUpdate) => {
  // Convert km to degrees (approximate)
  const latDelta = radiusInKm / 111;
  const lngDelta = radiusInKm / (111 * Math.cos(center.latitude * (Math.PI / 180)));

  const q = query(
    collection(db, 'responders'),
    where('latitude', '>=', center.latitude - latDelta),
    where('latitude', '<=', center.latitude + latDelta),
    where('online', '==', true)
  );

  return onSnapshot(q, (snapshot) => {
    const responders = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Filter by longitude after fetching to avoid Firestore limitations
      if (Math.abs(data.longitude - center.longitude) <= lngDelta) {
        responders.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to JS Date if needed
          lastSeen: data.lastSeen?.toDate(),
        });
      }
    });
    onRespondersUpdate(responders);
  });
};
