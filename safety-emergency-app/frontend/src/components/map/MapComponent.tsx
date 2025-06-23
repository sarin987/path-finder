import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export interface ResponderLocation {
  id: string;
  lat: number;
  lng: number;
  role: string;
  name: string;
  status?: string;
  lastUpdated?: string;
}

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  userLocation: [number, number] | null;
  responderLocations?: ResponderLocation[];
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  center, 
  zoom, 
  userLocation, 
  responderLocations = [] 
}) => {
  // Create custom icons for different responder types
  const createRoleIcon = (role: string) => {
    const iconSize = 32;
    const iconColor = {
      police: '#1a73e8',    // Blue for police
      ambulance: '#e53935', // Red for ambulance
      fire: '#ff8f00',     // Orange for fire
    }[role] || '#4caf50';  // Default green for other roles

    return L.divIcon({
      html: `
        <div style="
          background: ${iconColor};
          width: ${iconSize}px;
          height: ${iconSize}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${role.charAt(0).toUpperCase()}
        </div>
      `,
      className: 'responder-marker',
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2],
      popupAnchor: [0, -iconSize / 2]
    });
  };
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [containerReady, setContainerReady] = useState(false);

  // Handle map container resize and visibility changes
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    const container = mapContainerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    
    const checkContainerSize = () => {
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        if (!containerReady) {
          setContainerReady(true);
        }
        if (mapRef.current) {
          // Small delay to ensure container is fully rendered
          setTimeout(() => {
            mapRef.current?.invalidateSize();
          }, 100);
        }
      }
    };
    
    // Check size initially
    checkContainerSize();
    
    // Set up resize observer
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(checkContainerSize);
      resizeObserver.observe(container);
    }
    
    // Fallback for browsers without ResizeObserver
    const resizeTimer = setInterval(checkContainerSize, 1000);
    
    // Also check on window resize as a fallback
    window.addEventListener('resize', checkContainerSize);
    
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      clearInterval(resizeTimer);
      window.removeEventListener('resize', checkContainerSize);
    };
  }, [containerReady]);

  // Check container dimensions and set ready state
  const checkAndSetReady = useCallback(() => {
    if (!mapContainerRef.current) return false;
    
    const container = mapContainerRef.current;
    const hasDimensions = container.offsetWidth > 0 && container.offsetHeight > 0;
    
    if (hasDimensions && !containerReady) {
      console.log('Container ready with dimensions:', {
        width: container.offsetWidth,
        height: container.offsetHeight
      });
      setContainerReady(true);
      return true;
    }
    return false;
  }, [containerReady]);
  
  // Initial check when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      checkAndSetReady();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [checkAndSetReady]);

  // Initialize map
  useEffect(() => {
    if (!containerReady || !mapContainerRef.current) {
      console.log('Container not ready yet');
      return undefined;
    }
    
    const container = mapContainerRef.current;
    
    // Double check container has dimensions
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.log('Container has no dimensions, forcing check...');
      // Force a reflow and check again
      const checkAgain = () => {
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
          console.log('Container now has dimensions, initializing map...');
          setContainerReady(true);
        } else {
          console.log('Still no dimensions, waiting...');
          requestAnimationFrame(checkAgain);
        }
      };
      checkAgain();
      return undefined;
    }
    
    console.log('Map init effect running...');
    console.log('Container dimensions:', {
      width: container.offsetWidth,
      height: container.offsetHeight,
      clientWidth: container.clientWidth,
      clientHeight: container.clientHeight,
      scrollWidth: container.scrollWidth,
      scrollHeight: container.scrollHeight
    });
    
    if (mapRef.current) {
      console.log('Map already initialized, updating view...');
      mapRef.current.setView(center, zoom);
      return undefined;
    }

    try {
      console.log('Creating map instance...');
      
      // Create map instance
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
      });
      
      console.log('Map instance created:', map);

      // Add tile layer
      console.log('Adding tile layer...');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      
      console.log('Tile layer added');

      // Set map reference
      mapRef.current = map;
      console.log('Map ref set');
      
      // Force a reflow to ensure the map container has dimensions
      if (mapContainerRef.current) {
        const forceReflow = mapContainerRef.current.offsetHeight;
        console.log('Forced reflow, container height:', forceReflow);
      }
      
      // Trigger a resize event to ensure Leaflet recalculates the map size
      setTimeout(() => {
        map.invalidateSize();
        console.log('Map invalidated size');
      }, 0);
      
      setIsLoading(false);
      console.log('Loading state set to false');

      // Cleanup function
      return () => {
        map.remove();
        mapRef.current = null;
        markersRef.current = [];
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to load map. Please try again.');
      setIsLoading(false);
    }
  }, [center, zoom]);

  // Update map view and markers when center, zoom, userLocation, or responderLocations changes
  useEffect(() => {
    if (!mapRef.current || !containerReady) {
      console.log('Map not ready for update');
      return;
    }

    console.log('Updating map view to:', center, zoom);
    // Update map view
    const map = mapRef.current;
    map.setView(center, zoom);

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.remove();
    });
    markersRef.current = [];

    // Add user location marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        html: `
          <div style="
            background: #9c27b0;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          "></div>
        `,
        className: 'user-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      const userMarker = L.marker(userLocation, { icon: userIcon })
        .addTo(map)
        .bindPopup('Your location');
      markersRef.current.push(userMarker);
    }

    // Add responder markers
    responderLocations.forEach((responder: ResponderLocation) => {
      if (!responder.lat || !responder.lng) {
        console.warn('Invalid responder location:', responder);
        return;
      }

      const icon = createRoleIcon(responder.role);
      const marker = L.marker(
        [responder.lat, responder.lng], 
        { icon }
      )
        .addTo(map)
        .bindPopup(`
          <div>
            <strong>${responder.role.charAt(0).toUpperCase() + responder.role.slice(1)}</strong><br/>
            ${responder.name || 'Responder'}<br/>
            Status: ${responder.status || 'Available'}
          </div>
        `);
      markersRef.current.push(marker);
    });

  }, [center, zoom, userLocation, containerReady, JSON.stringify(responderLocations)]);

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100%',
        minHeight: '400px',
        bgcolor: 'background.default'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (mapError) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100%',
        minHeight: '400px',
        bgcolor: 'background.default',
        color: 'error.main',
        p: 2,
        textAlign: 'center'
      }}>
        {mapError}
      </Box>
    );
  }

  const handleRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      mapContainerRef.current = el;
      console.log('Container ref set, checking dimensions...');
      
      // Force a reflow by accessing offsetHeight
      el.offsetHeight; // This forces a reflow
      
      // Check immediately
      if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        console.log('Container has dimensions, setting ready');
        setContainerReady(true);
        return;
      }
      
      // If not ready, set up a more aggressive check
      let rafId: number;
      let timeoutId: NodeJS.Timeout;
      
      const checkDimensions = () => {
        if (!el) return;
        
        if (el.offsetWidth > 0 && el.offsetHeight > 0) {
          console.log('Container now has dimensions:', {
            width: el.offsetWidth,
            height: el.offsetHeight
          });
          setContainerReady(true);
          return;
        }
        
        // Continue checking on next frame
        rafId = requestAnimationFrame(checkDimensions);
        
        // Force ready after a timeout as a fallback
        timeoutId = setTimeout(() => {
          if (document.body.contains(el)) {
            console.log('Forcing container ready after timeout');
            setContainerReady(true);
          }
        }, 2000);
      };
      
      // Start checking
      rafId = requestAnimationFrame(checkDimensions);
      
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        if (timeoutId) clearTimeout(timeoutId);
      };
    } else {
      console.log('Container ref cleared');
      mapContainerRef.current = null;
      setContainerReady(false);
    }
  }, []);

  return (
    <Box 
      ref={handleRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '400px',
        backgroundColor: '#e0e0e0',
        display: 'block',
        flex: '1 1 auto',
        '& .leaflet-container': {
          width: '100% !important',
          height: '100% !important',
          minHeight: '400px',
          '& .leaflet-tile': {
            filter: 'none !important',
          },
          '& .leaflet-control-container': {
            '& > *': {
              pointerEvents: 'auto',
            }
          }
        }
      }}
    >
      {isLoading && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        }}>
          <CircularProgress />
        </Box>
      )}
      {mapError && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1001,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          p: 2,
          textAlign: 'center'
        }}>
          <Alert severity="error">{mapError}</Alert>
        </Box>
      )}
    </Box>
  );
};

export default MapComponent;
