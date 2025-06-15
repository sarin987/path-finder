import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { useAuth } from '../contexts/AuthContext';
import { getRoleLocations } from '../services/locationService';
import { getSOSRequests } from '@/services/sosService';
import config from '../config';
import { formatDistanceToNow } from 'date-fns';

const libraries: ['places'] = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem',
};

// Using MAP_DEFAULTS from config

const options = {
  disableDefaultUI: true,
  zoomControl: true,
};

interface Location {
  id: string;
  userId: string;
  lat: number;
  lng: number;
  name: string;
  role: string;
  phone?: string;
  lastUpdated: string;
  status?: string;
}

interface SOSRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  lat: number;
  lng: number;
  message: string;
  status: 'pending' | 'in-progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

const MapWithMarkers: React.FC = () => {
  const { token, user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Location | SOSRequest | null>(null);
  const [center] = useState(config.MAP_DEFAULTS.center);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Fetch SOS requests
  const fetchSOSRequests = useCallback(async () => {
    if (!token) return;
    
    try {
      const data = await getSOSRequests(token);
      setSosRequests(data);
    } catch (err) {
      console.error('Error fetching SOS requests:', err);
      setError('Failed to load SOS requests');
    }
  }, [token]);

  // Fetch responder locations
  const fetchLocations = useCallback(async () => {
    if (!token || !user?.role) return;
    
    try {
      const data = await getRoleLocations(token, user.role);
      setLocations(data);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load responder locations');
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.role]);

  // Initial data load
  useEffect(() => {
    if (isLoaded) {
      fetchSOSRequests();
      fetchLocations();
      
      // Set up polling
      const interval = setInterval(() => {
        fetchSOSRequests();
        fetchLocations();
      }, 30000); // Poll every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isLoaded, fetchSOSRequests, fetchLocations]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapClick = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const getMarkerIcon = (type: 'sos' | 'responder', status?: string) => {
    const baseUrl = window.location.origin;
    
    if (type === 'sos') {
      return {
        url: `${baseUrl}/sos-marker.png`,
        scaledSize: new window.google.maps.Size(40, 40),
      };
    }
    
    // Different icons based on responder status
    const iconName = status === 'available' ? 'available' : 'busy';
    return {
      url: `${baseUrl}/responder-${iconName}.png`,
      scaledSize: new window.google.maps.Size(32, 32),
    };
  };

  const renderInfoWindow = () => {
    if (!selectedMarker) return null;

    const isSOS = 'message' in selectedMarker;
    
    return (
      <InfoWindow
        position={{
          lat: selectedMarker.lat,
          lng: selectedMarker.lng,
        }}
        onCloseClick={() => setSelectedMarker(null)}
      >
        <div className="p-2 w-64">
          <h3 className="font-bold text-lg">
            {isSOS ? '🚨 SOS Alert' : '📍 Responder Location'}
          </h3>
          
          <div className="mt-2 space-y-1">
            <p className="font-medium">
              {isSOS ? selectedMarker.userName : selectedMarker.name}
            </p>
            
            {isSOS && (
              <>
                <p className="text-sm">{selectedMarker.message}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(selectedMarker.createdAt), { addSuffix: true })}
                </p>
                <p className="text-xs">Status: 
                  <span className={`font-medium ${
                    selectedMarker.status === 'pending' ? 'text-red-600' : 
                    selectedMarker.status === 'in-progress' ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {selectedMarker.status.replace('-', ' ')}
                  </span>
                </p>
              </>
            )}
            
            {!isSOS && selectedMarker.phone && (
              <p className="text-sm">
                📞 <a href={`tel:${selectedMarker.phone}`} className="text-blue-600 hover:underline">
                  {selectedMarker.phone}
                </a>
              </p>
            )}
            
            {!isSOS && selectedMarker.lastUpdated && (
              <p className="text-xs text-gray-500">
                Updated {formatDistanceToNow(new Date(selectedMarker.lastUpdated), { addSuffix: true })}
              </p>
            )}
            
            <div className="mt-2 pt-2 border-t">
              <button 
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                onClick={() => {
                  // TODO: Implement chat functionality
                  console.log('Start chat with', isSOS ? selectedMarker.userId : selectedMarker.userId);
                }}
              >
                💬 Start Chat
              </button>
            </div>
          </div>
        </div>
      </InfoWindow>
    );
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={center}
        options={options}
        onLoad={onMapLoad}
        onClick={onMapClick}
      >
        {/* SOS Request Markers */}
        {sosRequests.map((sos) => (
          <Marker
            key={`sos-${sos.id}`}
            position={{ lat: sos.lat, lng: sos.lng }}
            icon={getMarkerIcon('sos')}
            onClick={() => setSelectedMarker(sos)}
            animation={window.google.maps.Animation.DROP}
          />
        ))}

        {/* Responder Location Markers */}
        {locations.map((location) => (
          <Marker
            key={`loc-${location.id}`}
            position={{ lat: location.lat, lng: location.lng }}
            icon={getMarkerIcon('responder', location.status)}
            onClick={() => setSelectedMarker(location)}
          />
        ))}

        {renderInfoWindow()}
      </GoogleMap>
      
      {isLoading && (
        <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-3 py-1 rounded shadow-md">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading map data...</span>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg">
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm">SOS Alerts</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm">Responders</span>
        </div>
      </div>
    </div>
  );
};

export default MapWithMarkers;
