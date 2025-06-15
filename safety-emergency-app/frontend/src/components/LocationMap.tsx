import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';
import { getRoleLocations, type LocationResponse } from '../services/locationService';
import websocketService, { type LocationUpdateData } from '../services/websocketService';

// Type for location data
// Union type that can handle both API responses and real-time updates
type Location = Omit<LocationResponse, 'id' | 'userId' | 'name' | 'phone' | 'status'> & {
  id?: string;
  userId?: string;
  name: string;
  phone?: string;
  status?: string;
  lastUpdated: string;
};

interface LocationMapProps {
  role: string;
}

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for different roles
const roleIcons: Record<string, L.DivIcon> = {
  police: L.divIcon({
    html: '👮',
    className: 'role-icon',
    iconSize: [32, 32],
  }),
  ambulance: L.divIcon({
    html: '🚑',
    className: 'role-icon',
    iconSize: [32, 32],
  }),
  fire: L.divIcon({
    html: '🚒',
    className: 'role-icon',
    iconSize: [32, 32],
  }),
  parent: L.divIcon({
    html: '👪',
    className: 'role-icon',
    iconSize: [32, 32],
  }),
};

// Component to handle map view changes
const ChangeView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const LocationMap: React.FC<LocationMapProps> = ({ role }) => {
  const { token, user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Track active WebSocket subscriptions
  const subscriptions = useRef<Array<() => void>>([]);

  // Process API response to match our Location type
  const processApiLocations = useCallback((data: any[]): Location[] => {
    return data.map(loc => {
      // Handle both direct properties and nested user object
      const userData = loc.user || {};
      return {
        id: loc.id || loc.userId,
        userId: loc.userId || loc.id,
        name: userData.name || 'Unknown User',
        role: loc.role || loc.role_type,
        lat: parseFloat(loc.lat) || 0,
        lng: parseFloat(loc.lng) || 0,
        phone: loc.phone || userData.phone,
        status: loc.status || 'available',
        lastUpdated: loc.lastUpdated || loc.last_updated || new Date().toISOString(),
      };
    });
  }, []);

  // Fetch locations from the API
  const fetchLocations = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const data = await getRoleLocations(token, role);

      setLocations(prevLocations => {
        // Create a map of existing locations for quick lookup
        const locationMap = new Map(prevLocations.map(loc => [loc.userId, loc]));

        // Update existing locations or add new ones
        const processedData = processApiLocations(data);
        processedData.forEach(newLoc => {
          locationMap.set(newLoc.userId, newLoc);
        });

        // Remove locations that are older than 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return Array.from(locationMap.values())
          .filter(loc => new Date(loc.lastUpdated) > fiveMinutesAgo);
      });

      // Update center if this is the first load
      if (data.length > 0 && center[0] === 0 && center[1] === 0) {
        setCenter([data[0].lat, data[0].lng]);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load location data');
    } finally {
      setIsLoading(false);
    }
  }, [token, role, center]);

  // Initial data fetch
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Set up WebSocket for real-time updates
  useEffect(() => {
    if (!token || !user) return;

    // Connect to WebSocket
    websocketService.connect(token, user.id, user.role);
    setWsConnected(true);

    // Handle new location data from WebSocket
    const handleLocationUpdate = useCallback((data: LocationUpdateData) => {
      // Ensure required fields are present
      if (!data.userId || data.lat === undefined || data.lng === undefined) {
        console.warn('Received invalid location update:', data);
        return;
      }

      setLocations(prevLocations => {
        // Normalize the location data to match our Location type
        const normalizedLocation: Location = {
          id: data.userId,
          userId: data.userId,
          name: data.name || 'Unknown User',
          role: data.role,
          lat: data.lat,
          lng: data.lng,
          phone: data.phone,
          status: data.status || 'available',
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        };

        // Check if we already have this location
        const existingIndex = prevLocations.findIndex(
          loc => loc.userId === data.userId
        );

        // If it's a new location, add it
        if (existingIndex === -1) {
          return [...prevLocations, normalizedLocation];
        }

        // Otherwise, update the existing location
        const updatedLocations = [...prevLocations];
        updatedLocations[existingIndex] = {
          ...updatedLocations[existingIndex],
          ...normalizedLocation,
        };
        return updatedLocations;
      });
      setLastUpdated(new Date());
    }, []);

    // Subscribe to role-specific updates
    const handleLocationData = (data: LocationUpdateData) => {
      console.log('Received location update:', data);
      handleLocationUpdate(data);
    };

    
    const unsubscribe = websocketService.subscribeToRoleLocations(
      role,
      handleLocationData
    );
    
    // Store the unsubscribe function
    subscriptions.current.push(unsubscribe);

    // Set up polling as a fallback
    const intervalId = setInterval(fetchLocations, 30000); // Every 30 seconds

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      // Unsubscribe all WebSocket listeners
      subscriptions.current.forEach(unsub => unsub());
      subscriptions.current = []; // Clear the array
    };
  }, [token, user, role, fetchLocations]);

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center bg-red-50 rounded-lg">
        <div className="text-center text-red-600 p-4">
          <p className="font-medium">Error loading map</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const activeLocations = locations.filter(loc => {
    const lastUpdated = new Date(loc.lastUpdated);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastUpdated > fiveMinutesAgo;
  });

  // Show connection status and last updated time in the UI
  const statusText = wsConnected 
    ? `Live - Updated: ${lastUpdated?.toLocaleTimeString() || 'Just now'}`
    : 'Connecting...';

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200 relative">
      <div className="absolute top-2 right-2 z-[1000] bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-700 flex items-center">
        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${wsConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
        {statusText}
      </div>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <ChangeView center={center} zoom={13} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {activeLocations.map((location) => (
          <Marker
            key={location.userId}
            position={[location.lat, location.lng]}
            icon={roleIcons[location.role] || roleIcons.parent}
          >
            <Popup>
              <div className="space-y-1 min-w-[150px]">
                <div className="font-semibold">{location.name || 'Unknown User'}</div>
                <div className="text-sm capitalize">{location.role}</div>
                {location.phone && (
                  <div className="text-sm">
                    <a 
                      href={`tel:${location.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {location.phone}
                    </a>
                  </div>
                )}
                {location.status && (
                  <div className="text-xs">
                    Status: <span className="capitalize">{location.status}</span>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Updated: {new Date(location.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LocationMap;
