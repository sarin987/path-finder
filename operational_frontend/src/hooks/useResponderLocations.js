import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../config';
import { socketManager } from '../services/socket';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  calculateDistance, 
  sortByDistance, 
  filterByDistance,
  formatDistance
} from '../utils/geoUtils';

// Cache key for responder data
const RESPONDER_CACHE_KEY = 'responder_locations_cache';

const useResponderLocations = (options = {}) => {
  const {
    center,
    radius = 10, // in kilometers
    enabled = true,
    roles = ['police', 'ambulance', 'fire'],
    sortByProximity = true,
    filterByRole = true,
    maxDistance = 50 // Maximum distance in km
  } = options;

  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(enabled ? null : 'Hook is disabled');
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isMounted = useRef(true);
  const socketRef = useRef(null);
  
  // Fetch initial responder data from API
  const fetchResponders = useCallback(async () => {
    if (!enabled || !center) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/responders/nearby`, {
        params: {
          latitude: center.latitude,
          longitude: center.longitude,
          radius,
          roles: roles.join(',')
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (!isMounted.current) return;
      
      if (response.data && response.data.success) {
        setResponders(response.data.data || []);
        setLastUpdated(new Date());
      } else {
        throw new Error(response.data?.message || 'Invalid response format');
      }
    } catch (error) {
      if (!isMounted.current) return;
      
      console.error('Error fetching responder data:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to load responder data';
      setError(errorMessage);
      
      // If unauthorized, clear token and trigger re-authentication
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('userToken');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [center, radius, roles, enabled]);

  // Handle WebSocket updates
  const handleLocationUpdate = useCallback((data) => {
    if (!isMounted.current || !data || !data.userId || !data.location) return;
    
    try {
      setResponders(prevResponders => {
        const existingIndex = prevResponders.findIndex(r => r.userId === data.userId);

        if (existingIndex >= 0) {
          // Update existing responder
          const updated = [...prevResponders];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...data,
            lastUpdated: new Date()
          };
          return updated;
        } else if (data.role && roles.includes(data.role)) {
          // Add new responder if role matches
          return [...prevResponders, { 
            ...data, 
            lastUpdated: new Date() 
          }];
        }

        return prevResponders;
      });
      
      // Update last updated timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error updating responder location:', error);
    }
  }, [roles]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!enabled) return;

    let isSubscribed = true;
    const setupWebSocket = async () => {
      try {
        // Fetch initial data
        if (isSubscribed) {
          await fetchResponders();
        }
        
        // Connect to WebSocket
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Initialize socket connection
        await socketManager.connect(token);
        
        if (!isSubscribed) return;
        
        // Set up event listeners
        const onConnect = () => {
          console.log('WebSocket connected');
          if (isSubscribed) {
            setSocketConnected(true);
            fetchResponders();
          }
        };

        const onDisconnect = () => {
          console.log('WebSocket disconnected');
          if (isSubscribed) {
            setSocketConnected(false);
          }
        };

        const onError = (error) => {
          console.error('WebSocket error:', error);
          if (isSubscribed) {
            setError('Connection error');
          }
        };

        socketManager.on('connect', onConnect);
        socketManager.on('disconnect', onDisconnect);
        socketManager.on('error', onError);
        socketManager.on('locationUpdate', handleLocationUpdate);

        // Cleanup function
        return () => {
          socketManager.off('connect', onConnect);
          socketManager.off('disconnect', onDisconnect);
          socketManager.off('error', onError);
          socketManager.off('locationUpdate', handleLocationUpdate);
        };

      } catch (error) {
        console.error('Failed to setup WebSocket:', error);
        if (isSubscribed) {
          setError('Failed to connect to real-time updates');
          setLoading(false);
        }
      }
    };

    setupWebSocket();

    // Cleanup on unmount
    return () => {
      isSubscribed = false;
      isMounted.current = false;
      // Don't disconnect the socket here as it might be used by other components
    };
  }, [enabled, fetchResponders, handleLocationUpdate]);

  // Refresh data when center or radius changes
  useEffect(() => {
    if (enabled && center) {
      fetchResponders();
    }
  }, [center?.latitude, center?.longitude, radius, enabled, fetchResponders]);

  // Process and filter responders based on options
  const processedResponders = useMemo(() => {
    if (!responders.length) return [];
    
    let result = [...responders];
    
    // Filter by role if enabled
    if (filterByRole && roles.length > 0) {
      result = result.filter(responder => 
        responder.role && roles.includes(responder.role)
      );
    }
    
    // Filter by distance if center is provided
    if (center && (center.latitude !== undefined && center.longitude !== undefined)) {
      result = filterByDistance(result, center, maxDistance);
      
      // Sort by distance if enabled
      if (sortByProximity) {
        result = sortByDistance(result, center);
      }
      
      // Add distance information to each responder
      result = result.map(responder => ({
        ...responder,
        distance: calculateDistance(
          center.latitude,
          center.longitude,
          responder.latitude || responder.lat || 0,
          responder.longitude || responder.lng || 0
        ),
        distanceFormatted: formatDistance(
          calculateDistance(
            center.latitude,
            center.longitude,
            responder.latitude || responder.lat || 0,
            responder.longitude || responder.lng || 0
          )
        )
      }));
    }
    
    return result;
  }, [responders, center, roles, filterByRole, sortByProximity, maxDistance]);
  
  // Get responder count by role
  const responderCounts = useMemo(() => {
    const counts = {};
    processedResponders.forEach(responder => {
      if (responder.role) {
        counts[responder.role] = (counts[responder.role] || 0) + 1;
      }
    });
    return counts;
  }, [processedResponders]);

  // Get unique roles from current responders
  const availableRoles = useMemo(() => {
    const rolesSet = new Set();
    processedResponders.forEach(responder => {
      if (responder.role) {
        rolesSet.add(responder.role);
      }
    });
    return Array.from(rolesSet);
  }, [processedResponders]);

  // Memoize the return value to prevent unnecessary re-renders
  const result = useMemo(() => ({
    // Raw data
    responders: processedResponders,
    loading,
    error,
    lastUpdated,
    socketConnected,
    
    // Derived data
    responderCounts,
    availableRoles,
    
    // Actions
    refetch: fetchResponders,
    
    // Helpers
    getResponderById: (id) => 
      processedResponders.find(r => r.id === id || r.userId === id),
    getRespondersByRole: (role) => 
      processedResponders.filter(r => r.role === role),
    getClosestResponder: () => 
      processedResponders.length > 0 ? processedResponders[0] : null,
    
    // Status
    hasResponders: processedResponders.length > 0,
    totalResponders: processedResponders.length
  }), [
    processedResponders, 
    loading, 
    error, 
    lastUpdated, 
    socketConnected, 
    responderCounts, 
    availableRoles,
    fetchResponders
  ]);

  return result;
};

export default useResponderLocations;

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}
