import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import websocketService from '../services/websocketService';
import { updateLocation } from '../services/locationService';

interface UserLocationTrackerProps {
  token: string;
  role: string;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

const UserLocationTracker: React.FC<UserLocationTrackerProps> = ({
  token,
  role,
  onLocationUpdate,
}) => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Handle WebSocket connection and location updates
  useEffect(() => {
    if (!user || !token) return;

    // Connect to WebSocket
    websocketService.connect(token, user.id, role);
    setWsConnected(true);

    // Set up WebSocket event listeners
    const handleWsConnect = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    websocketService.on('connect', handleWsConnect);

    // Clean up WebSocket connection on unmount
    return () => {
      websocketService.off('connect');
      websocketService.disconnect();
      setWsConnected(false);
    };
  }, [user, token, role]);

  // Handle geolocation updates
  const handlePositionUpdate = useCallback(async (position: GeolocationPosition) => {
    if (!user || !token) return;

    const { latitude: lat, longitude: lng } = position.coords;
    const location = { lat, lng };
    
    setCurrentLocation(location);
    if (onLocationUpdate) {
      onLocationUpdate(location);
    }

    try {
      // Update location via REST API
      await updateLocation(token, role, lat, lng);
      
      // Also send via WebSocket for real-time updates
      if (wsConnected) {
        websocketService.updateLocation({ lat, lng });
      }
    } catch (err) {
      console.error('Failed to update location:', err);
      setError('Failed to update location on server');
    }
  }, [user, token, role, onLocationUpdate, wsConnected]);

  // Set up geolocation watcher
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const handlePositionError = (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error);
      setError('Unable to retrieve your location');
      setIsTracking(false);
    };

    setIsTracking(true);
    const watchId = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true,
        maximumAge: 10000, // 10 seconds
        timeout: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, [handlePositionUpdate]);

  if (error) {
    return (
      <div className="p-3 bg-red-50 text-red-700 rounded-lg">
        <p className="font-medium">Location Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!currentLocation) {
    return (
      <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
        <p>Getting your location...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">Your Location</h3>
        <div className="flex items-center">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${wsConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
          <span className="text-xs text-gray-500">
            {wsConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm">
          <span className="text-gray-600">Latitude:</span>{' '}
          <span className="font-mono">{currentLocation.lat.toFixed(6)}</span>
        </p>
        <p className="text-sm">
          <span className="text-gray-600">Longitude:</span>{' '}
          <span className="font-mono">{currentLocation.lng.toFixed(6)}</span>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          {isTracking ? 'Location tracking active' : 'Location tracking paused'}
        </p>
      </div>
    </div>
  );
};

export default UserLocationTracker;
