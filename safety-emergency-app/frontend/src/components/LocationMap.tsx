import React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import L, { type LatLngTuple, type Map as LeafletMap, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Switch, FormControlLabel } from '@mui/material';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Wrapper component to handle map instance
const MapWrapper = React.memo(({ 
  center, 
  zoom, 
  style, 
  onMapMount,
  children 
}: { 
  center: LatLngTuple; 
  zoom: number; 
  style: React.CSSProperties;
  onMapMount: (map: LeafletMap) => void | (() => void);
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  // Set mounted ref to false when component unmounts
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initialize map only once
  useEffect(() => {
    if (!containerRef.current || mapInitialized || !mountedRef.current) return;

    console.log('Initializing map...');
    
    let map: LeafletMap | null = null;
    let resizeTimer: NodeJS.Timeout | null = null;
    
    try {
      map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: false,
      });

      // Store the map instance
      mapRef.current = map;
      
      // Call the onMapMount callback and store the cleanup function
      const mountCleanup = onMapMount(map);
      if (mountCleanup) {
        cleanupRef.current = mountCleanup;
      }
      
      // Add base layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        tileSize: 256,
        zoomOffset: 0
      }).addTo(map);

      // Initial invalidate size
      resizeTimer = setTimeout(() => {
        if (mountedRef.current && map) {
          map.invalidateSize();
        }
      }, 100);
      
      setMapInitialized(true);
    } catch (error) {
      console.error('Error initializing map:', error);
      return;
    }
    
    // Cleanup function
    return () => {
      if (!mountedRef.current) return;
      
      console.log('Cleaning up map instance in MapWrapper...');
      
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      
      // Call the cleanup function from onMapMount if it exists
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      
      if (map) {
        try {
          // Remove all event listeners
          map.off();
          // Remove all layers
          map.eachLayer((layer) => {
            if (map && map.hasLayer(layer)) {
              map.removeLayer(layer);
            }
          });
          // Remove the map
          map.remove();
          
          // Clear the map container
          const container = map.getContainer();
          if (container?.parentNode) {
            container.parentNode.removeChild(container);
          }
        } catch (e) {
          console.warn('Error cleaning up map instance in MapWrapper:', e);
        } finally {
          map = null;
          mapRef.current = null;
        }
      }
    };
  }, [center, zoom, onMapMount, mapInitialized]);

  // Handle window resize
  useEffect(() => {
    if (!mapRef.current) return;

    const handleResize = () => {
      mapRef.current?.invalidateSize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ ...style, height: '100%', width: '100%' }}
      className="map-container"
    >
      {mapInitialized && children}
    </div>
  );
});

MapWrapper.displayName = 'MapWrapper';

// Fix for default marker icons in Leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface Location {
  id: string;
  userId: string;
  name: string;
  role: string;
  lat: number;
  lng: number;
  status: string;
  lastUpdated: string;
  phone?: string;
}

interface LocationMapProps {
  role: string;
  className?: string;
  style?: React.CSSProperties;
  onLocationClick?: (location: Location) => void;
}

const MOCK_RESPONDERS: Location[] = [
  {
    id: '1',
    userId: '1',
    name: 'Police Unit 1',
    role: 'police',
    lat: 12.9716,
    lng: 77.5946,
    status: 'available',
    lastUpdated: new Date().toISOString(),
    phone: '+1234567890'
  }
];

// Map click handler component
const MapClickHandler = React.memo(({ 
  onClick, 
  enabled 
}: { 
  onClick: (e: L.LeafletMouseEvent) => void; 
  enabled: boolean;
}) => {
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (enabled) {
        onClick(e);
      }
    };

    const currentMap = map.current;
    if (currentMap) {
      currentMap.on('click', handleClick);
    }

    return () => {
      if (currentMap) {
        currentMap.off('click', handleClick);
      }
    };
  }, [enabled, onClick]);

  // This is a workaround to get the map instance
  // The actual map instance will be set by the parent
  return <div ref={(el) => {
    if (el && !map.current) {
      const parent = el.parentElement as HTMLElement & { _leaflet_map?: L.Map };
      if (parent?._leaflet_map) {
        map.current = parent._leaflet_map;
      }
    }
  }} style={{ display: 'none' }} />;
});

MapClickHandler.displayName = 'MapClickHandler';

const LocationMap: React.FC<LocationMapProps> = ({
  role,
  className = '',
  style = { height: '500px', width: '100%' },
  onLocationClick = () => {}
}): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  // State for map instance and mock data
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [mockLocations, setMockLocations] = useState<Location[]>([]);
  const [useMockData, setUseMockData] = useState(false);
  const mountedRef = useRef(true);
  
  // Refs for cleanup
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const markersRef = useRef<L.Layer[]>([]);
  
  // Map configuration
  const center: LatLngTuple = [12.9716, 77.5946]; // Default to Bangalore
  const zoom = 13;

  // Handle map click to add new mock locations
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!useMockData || !onLocationClick) return;
    
    // ...
    if (!e?.latlng) {
      console.warn('Invalid map click event:', e);
      return;
    }
    
    const newLocation: Location = {
      id: `mock-${Date.now()}`,
      userId: `mock-user-${Date.now()}`,
      name: `Mock ${role.charAt(0).toUpperCase() + role.slice(1)} ${mockLocations.length + 1}`,
      role,
      lat: e.latlng.lat,
      lng: e.latlng.lng,
      status: 'available',
      lastUpdated: new Date().toISOString(),
      phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`
    };
    
    console.log('Adding new mock location:', newLocation);
    setMockLocations(prev => [...prev, newLocation]);
    onLocationClick(newLocation);
  }, [useMockData, onLocationClick, role, mockLocations.length]);

  // Initialize mock data when useMockData changes
  useEffect(() => {
    if (useMockData) {
      console.log('Initializing mock data...');
      setMockLocations([...MOCK_RESPONDERS]);
      
      // Set up interval to update mock locations
      const interval = setInterval(() => {
        setMockLocations(prevLocations => 
          prevLocations.map(loc => ({
            ...loc,
            lat: loc.lat + (Math.random() * 0.001 - 0.0005),
            lng: loc.lng + (Math.random() * 0.001 - 0.0005),
            lastUpdated: new Date().toISOString()
          }))
        );
      }, 5000);
      
      mockIntervalRef.current = interval;
      
      return () => {
        if (mockIntervalRef.current) {
          clearInterval(mockIntervalRef.current);
          mockIntervalRef.current = null;
        }
      };
    } else {
      setMockLocations([]);
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
        mockIntervalRef.current = null;
      }
    }
  }, [useMockData]);

  // Handle window resize and visibility changes
  useEffect(() => {
    if (!mapInstance) return;
    
    const handleResize = () => {
      if (mapInstance && !mapInstance.getContainer().offsetParent) {
        // Map container is not visible, skip resize
        return;
      }
      
      // Use setTimeout to ensure the container has the correct dimensions
      const timer = setTimeout(() => {
        try {
          mapInstance.invalidateSize({ animate: false });
        } catch (e) {
          console.warn('Error resizing map:', e);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    };
    
    // Add a small delay before the first resize to ensure the container is ready
    const initialTimer = setTimeout(handleResize, 300);
    
    window.addEventListener('resize', handleResize);
    
    // Set up a MutationObserver to detect when the map becomes visible
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as HTMLElement;
          if (target.offsetParent !== null) {
            // Map container is now visible, trigger a resize
            handleResize();
          }
        }
      });
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        attributes: true,
        attributeFilter: ['style'],
        subtree: true
      });
    }
    
    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [mapInstance]);

  const handleMapCreated = useCallback((map: LeafletMap) => {
    console.log('Map created:', map);
    setMapInstance(map);
    
    // Trigger a resize to ensure the map is properly sized
    const resizeTimeout = setTimeout(() => {
      console.log('Invalidating map size');
      map.invalidateSize();
    }, 0);

    // Add click handler if mock data is enabled
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!useMockData || !onLocationClick) return;
      
      try {
        const newLocation: Location = {
          id: `mock-${Date.now()}`,
          userId: `mock-user-${Date.now()}`,
          name: `Mock ${role.charAt(0).toUpperCase() + role.slice(1)} ${mockLocations.length + 1}`,
          role,
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          status: 'available',
          lastUpdated: new Date().toISOString(),
          phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`
        };
        
        console.log('Adding new mock location:', newLocation);
        setMockLocations(prev => [...prev, newLocation]);
        onLocationClick(newLocation);
      } catch (error) {
        console.error('Error handling map click:', error);
      }
    };

    if (useMockData) {
      map.on('click', handleClick);
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up map instance in handleMapCreated');
      clearTimeout(resizeTimeout);
      if (map) {
        map.off('click', handleClick);
      }
    };
  }, [useMockData, onLocationClick, mockLocations.length, role]);

  // Update markers when mockLocations or mapInstance changes
  useEffect(() => {
    if (!mapInstance) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker && mapInstance.hasLayer(marker)) {
        mapInstance.removeLayer(marker);
      }
    });
    markersRef.current = [];
    
    // Add new markers for each location
    mockLocations.forEach(location => {
      try {
        const marker = L.marker([location.lat, location.lng], {
          title: location.name,
          alt: location.name,
          riseOnHover: true
        }).addTo(mapInstance);
        
        // Add popup with location info
        marker.bindPopup(`
          <div>
            <h3>${location.name}</h3>
            <p>Status: ${location.status}</p>
            <p>Last updated: ${new Date(location.lastUpdated).toLocaleString()}</p>
            ${location.phone ? `<p>Phone: ${location.phone}</p>` : ''}
          </div>
        `);
        
        markersRef.current.push(marker);
      } catch (error) {
        console.error('Error adding marker:', error);
      }
    });
    
    // Fit bounds to show all markers if we have any
    if (markersRef.current.length > 0) {
      const group = new L.FeatureGroup(markersRef.current);
      mapInstance.fitBounds(group.getBounds().pad(0.1));
    }
    
    return () => {
      // Clean up markers on unmount or when locations change
      markersRef.current.forEach(marker => {
        if (marker && mapInstance.hasLayer(marker)) {
          mapInstance.removeLayer(marker);
        }
      });
      markersRef.current = [];
    };
  }, [mockLocations, mapInstance]);
  
  // Cleanup function
  useEffect(() => {
    // Set mounted ref to false when component unmounts
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle map instance cleanup
  useEffect(() => {
    // Skip if no map instance or component is unmounted
    if (!mapInstance || !mountedRef.current) return;
    
    const currentMapInstance = mapInstance;
    const currentInterval = mockIntervalRef.current;
    
    return () => {
      console.log('Cleaning up LocationMap');
      
      // Clear any intervals
      if (currentInterval) {
        console.log('Clearing mock data interval');
        clearInterval(currentInterval);
        mockIntervalRef.current = null;
      }
      
      // Clean up markers
      markersRef.current.forEach(marker => {
        if (marker && currentMapInstance?.hasLayer(marker)) {
          currentMapInstance.removeLayer(marker);
        }
      });
      markersRef.current = [];
      
      // Clean up the map instance
      if (currentMapInstance) {
        try {
          console.log('Removing map instance and cleaning up');
          // Remove all event listeners
          currentMapInstance.off();
          // Remove all layers
          currentMapInstance.eachLayer((layer) => {
            if (currentMapInstance.hasLayer(layer)) {
              currentMapInstance.removeLayer(layer);
            }
          });
          // Remove the map
          currentMapInstance.remove();
          
          // Clear the map container
          const container = currentMapInstance.getContainer();
          if (container?.parentNode) {
            container.parentNode.removeChild(container);
          }
        } catch (e) {
          console.warn('Error cleaning up map instance:', e);
        } finally {
          if (mountedRef.current) {
            setMapInstance(null);
          }
        }
      }
    };
  }, [mapInstance]);

  // Toggle mock data
  const handleMockDataToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const useMock = event.target.checked;
    setUseMockData(useMock);
    
    // No need to remount the map, just update the state
    if (useMock) {
      // Start location updates if not already running
      if (!mockIntervalRef.current) {
        mockIntervalRef.current = setInterval(() => {
          setMockLocations(prev => 
            prev.map(loc => ({
              ...loc,
              lat: loc.lat + (Math.random() * 0.001 - 0.0005),
              lng: loc.lng + (Math.random() * 0.001 - 0.0005),
              lastUpdated: new Date().toISOString()
            }))
          );
        }, 5000);
      }
    } else if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`location-map ${className}`} 
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000, 
        backgroundColor: 'white', 
        padding: '5px', 
        borderRadius: '4px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
      }}>
        <FormControlLabel
          control={
            <Switch
              checked={useMockData}
              onChange={handleMockDataToggle}
              color="primary"
            />
          }
          label="Show Mock Data"
          style={{ margin: 0 }}
        />
      </div>

      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <MapWrapper
          center={center}
          zoom={zoom}
          style={{ width: '100%', height: '100%' }}
          onMapMount={handleMapCreated}
        >
          {mapInstance && (
            <div>
              {/* Additional map layers or components can go here */}
              <MapClickHandler onClick={handleMapClick} enabled={useMockData} />
            </div>
          )}
        </MapWrapper>

        {!mapInstance && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 100
          }}>
            <div>Loading map...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationMap;