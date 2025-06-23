import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { API_ROUTES } from '../config/network';
import { socketManager } from '../utils/socket';
import axios from 'axios';

const useResponderLocations = (authToken, enabled = true) => {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(enabled); // Initialize based on enabled state
  const [error, setError] = useState(enabled ? null : 'Hook is disabled');
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Reset state when hook is disabled
  useEffect(() => {
    if (!enabled) {
      console.log('Hook is disabled, resetting state');
      setResponders([]);
      setLoading(false);
      setError('Hook is disabled - no auth token available');
      setSocketConnected(false);
    } else if (!authToken) {
      console.log('No auth token available, setting error');
      setError('Authentication required');
      setLoading(false);
    }
  }, [enabled, authToken]);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !authToken) return;

    // Connect to socket
    const socket = socketManager.connect(authToken);
    
    // Handle connection status
    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    // Cleanup function
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.disconnect();
    };

    // Initial load of responders
    const loadResponders = async () => {
      try {
        if (!authToken) {
          console.warn('No auth token available in loadResponders');
          setError('Authentication required');
          return;
        }

        setLoading(true);
        const url = `${API_ROUTES.base}${API_ROUTES.locations.responders}`;
        console.log('Fetching responders from:', url);
        
        const response = await axios.get(url, {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });
        
        console.log('API Response Status:', response.status, response.statusText);
        console.log('API Response Headers:', response.headers);
        console.log('API Response Data:', response.data);
        
        // Handle different response formats
        let respondersData = [];
        const responseData = response.data;
        
        if (!responseData) {
          console.warn('Empty response from server');
          setError('No data received from server');
          return;
        }
        
        // Handle different possible response formats
        if (Array.isArray(responseData)) {
          respondersData = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          respondersData = responseData.data;
        } else if (responseData.responders && Array.isArray(responseData.responders)) {
          respondersData = responseData.responders;
        } else if (responseData.data?.responders && Array.isArray(responseData.data.responders)) {
          respondersData = responseData.data.responders;
        } else {
          console.warn('Unexpected API response format:', responseData);
          setError('Unexpected response format from server');
          return;
        }
        
        console.log('Processed responders data:', respondersData);
        setResponders(respondersData);
        setError(null);
      } catch (err) {
        const errorMessage = err.response 
          ? `Server responded with ${err.response.status}: ${err.response.statusText}`
          : err.message;
          
        console.error('Error loading responders:', {
          message: errorMessage,
          config: err.config,
          response: err.response?.data
        });
        
        setError(`Failed to load responders: ${errorMessage}`);
        setResponders([]); // Reset to empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadResponders();

    // Subscribe to real-time updates
    const unsubscribe = socketManager.subscribeToResponderLocations((responder) => {
      setResponders(prevResponders => {
        const existingIndex = prevResponders.findIndex(r => r.user_id === responder.userId);
        
        if (existingIndex >= 0) {
          // Update existing responder
          const updated = [...prevResponders];
          updated[existingIndex] = {
            ...updated[existingIndex],
            lat: responder.lat,
            lng: responder.lng,
            status: responder.status,
            last_updated: responder.lastUpdated,
          };
          return updated;
        } else {
          // Add new responder
          return [...prevResponders, {
            user_id: responder.userId,
            role: responder.role,
            lat: responder.lat,
            lng: responder.lng,
            status: responder.status,
            last_updated: responder.lastUpdated,
            user: {
              name: responder.name || `Responder ${responder.userId}`,
            },
          }];
        }
      });
    });

    // Handle responder going offline
    const handleOffline = (data) => {
      setResponders(prevResponders => 
        prevResponders.filter(r => r.user_id !== data.userId)
      );
    };

    socketManager.on('responder_offline', handleOffline);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socketManager.off('responder_offline', handleOffline);
      unsubscribe();
    };
  }, [authToken, enabled]);

    // Function to refresh responders
    const refreshResponders = useCallback(async () => {
      if (!enabled) {
        console.warn('Hook is disabled - cannot refresh');
        setError('Hook is disabled - cannot refresh');
        return [];
      }
      
      if (!authToken) {
        console.warn('No auth token available for refresh');
        setError('Authentication required');
        return [];
      }
      
      try {
        setLoading(true);
        const url = `${API_ROUTES.base}${API_ROUTES.locations.responders}`;
        console.log('Refreshing responders from:', url);
        
        const response = await axios.get(url, {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });
      
      console.log('Refresh response status:', response.status, response.statusText);
      console.log('Refresh response data:', response.data);
      
      // Handle different response formats
      let respondersData = [];
      const responseData = response.data;
      
      if (!responseData) {
        console.warn('Empty refresh response from server');
        setError('No data received from server');
        return [];
      }
      
      // Handle different possible response formats
      if (Array.isArray(responseData)) {
        respondersData = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        respondersData = responseData.data;
      } else if (responseData.responders && Array.isArray(responseData.responders)) {
        respondersData = responseData.responders;
      } else if (responseData.data?.responders && Array.isArray(responseData.data.responders)) {
        respondersData = responseData.data.responders;
      } else {
        console.warn('Unexpected refresh response format:', responseData);
        setError('Unexpected response format from server');
        return [];
      }
      
      console.log('Processed refresh data:', respondersData);
      setResponders(respondersData);
      setError(null);
      return respondersData;
    } catch (err) {
      const errorMessage = err.response 
        ? `Server responded with ${err.response.status}: ${err.response.statusText}`
        : err.message;
        
      console.error('Error refreshing responders:', {
        message: errorMessage,
        config: err.config,
        response: err.response?.data
      });
      
      setError(`Failed to refresh responders: ${errorMessage}`);
      setResponders([]); // Reset to empty array on error
      return [];
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  return {
    responders,
    loading,
    error,
    socketConnected,
    refresh: refreshResponders,
  };
};

export default useResponderLocations;
