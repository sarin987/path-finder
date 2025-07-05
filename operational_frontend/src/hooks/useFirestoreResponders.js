import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useFirestoreResponders = (center, radiusInKm = 10, roles = []) => {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const isMounted = useRef(true);

  // Calculate distance between two points in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * 
      Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * 
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Calculate bounds based on center and radius
  const calculateBounds = useCallback((center, radius) => {
    if (!center || !center.latitude || !center.longitude) {
      return {
        minLat: -90,
        maxLat: 90,
        minLng: -180,
        maxLng: 180
      };
    }

    const latDelta = radius / 111; // 1 degree ~ 111km
    const lngDelta = radius / (111 * Math.cos(center.latitude * (Math.PI / 180)));
    
    return {
      minLat: center.latitude - latDelta,
      maxLat: center.latitude + latDelta,
      minLng: center.longitude - lngDelta,
      maxLng: center.longitude + lngDelta
    };
  }, []);

  // Filter and process responders
  const filterResponders = useCallback((snapshot, bounds) => {
    if (!snapshot || !snapshot.docs) return [];
    
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastSeen: data.lastSeen?.toDate ? data.lastSeen.toDate() : new Date(),
          role: data.role || 'unknown',
          online: data.online !== undefined ? data.online : true,
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          name: data.name || 'Unknown Responder'
        };
      })
      .filter(responder => {
        // Filter by role if specified
        if (roles.length > 0 && !roles.includes(responder.role)) {
          return false;
        }
        
        // Filter by bounds if center is provided
        if (center && center.latitude && center.longitude) {
          const inBounds = 
            responder.latitude >= bounds.minLat &&
            responder.latitude <= bounds.maxLat &&
            responder.longitude >= bounds.minLng &&
            responder.longitude <= bounds.maxLng;
          
          if (!inBounds) return false;
        }
        
        // Only show online responders
        return responder.online === true;
      });
  }, [roles, center]);

  // Set up Firestore listener
  useEffect(() => {
    if (!center) return;
    
    isMounted.current = true;
    setLoading(true);
    setError(null);
    
    const bounds = calculateBounds(center, radiusInKm);
    
    // Create query constraints
    const constraints = [
      where('latitude', '>=', bounds.minLat - 0.1), // Add buffer
      where('latitude', '<=', bounds.maxLat + 0.1),
      where('longitude', '>=', bounds.minLng - 0.1),
      where('longitude', '<=', bounds.maxLng + 0.1),
      where('online', '==', true),
      orderBy('lastSeen', 'desc')
    ];
    
    // Add role filter if specified
    if (roles.length > 0) {
      constraints.push(where('role', 'in', roles));
    }
    
    const q = query(collection(db, 'responders'), ...constraints);
    
    // Initial fetch
    const fetchInitialData = async () => {
      try {
        const querySnapshot = await getDocs(q);
        if (isMounted.current) {
          const filteredResponders = filterResponders(querySnapshot, bounds);
          const respondersWithDistance = filteredResponders.map(responder => ({
            ...responder,
            distance: calculateDistance(
              center.latitude,
              center.longitude,
              responder.latitude,
              responder.longitude
            )
          })).sort((a, b) => a.distance - b.distance);
          
          setResponders(respondersWithDistance);
          setLoading(false);
        }
      } catch (err) {
        console.error('Initial fetch error:', err);
        if (isMounted.current) {
          setError('Failed to load initial data');
          setLoading(false);
        }
      }
    };
    
    fetchInitialData();
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMounted.current) return;
        
        try {
          const filteredResponders = filterResponders(snapshot, bounds);
          const respondersWithDistance = filteredResponders.map(responder => ({
            ...responder,
            distance: calculateDistance(
              center.latitude,
              center.longitude,
              responder.latitude,
              responder.longitude
            )
          })).sort((a, b) => a.distance - b.distance);
          
          setResponders(respondersWithDistance);
          setLoading(false);
        } catch (err) {
          console.error('Error processing responders:', err);
          setError('Failed to process responder data');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Firestore error:', err);
        if (isMounted.current) {
          setError('Connection error. Trying to reconnect...');
          setLoading(false);
        }
      }
    );
    
    // Store unsubscribe function
    unsubscribeRef.current = unsubscribe;
    
    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [center, radiusInKm, roles, calculateBounds, filterResponders]);
  
  // Return the state and any helper functions
  const sortedResponders = center && center.latitude && center.longitude
    ? [...responders]
        .map(responder => ({
          ...responder,
          distance: calculateDistance(
            center.latitude,
            center.longitude,
            responder.latitude,
            responder.longitude
          )
        }))
        .sort((a, b) => a.distance - b.distance)
    : responders;

  return {
    responders: sortedResponders,
    loading,
    error,
    count: sortedResponders.length
  };
};

// Helper function to calculate distance between two points in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
