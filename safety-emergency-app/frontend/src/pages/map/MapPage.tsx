import React, { useCallback, useEffect, useState } from 'react';
import { 
  Box, 
  useTheme, 
  useMediaQuery, 
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import the MapComponent
import MapComponent from '../../components/map/MapComponent';

// Fix for default marker icons in Leaflet
const initializeLeafletIcons = () => {
  // Type assertion for Leaflet's Icon class
  const defaultIcon = L.Icon.Default as any;
  
  // Remove the _getIconUrl property if it exists
  if (defaultIcon.prototype && defaultIcon.prototype._getIconUrl) {
    delete defaultIcon.prototype._getIconUrl;
  }
  
  // Set the default icon options
  defaultIcon.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};



// Default coordinates (can be changed based on user's location or requirements)
const DEFAULT_CENTER = [51.505, -0.09] as [number, number]; // Default to London
const DEFAULT_ZOOM = 13;

const MapPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Leaflet icons when component mounts
  useEffect(() => {
    initializeLeafletIcons();
  }, []);

  // Handle recenter button click
  const handleRecenter = useCallback(() => {
    if (userLocation) {
      setMapCenter(userLocation);
      setZoom(DEFAULT_ZOOM);
    } else if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userCoords: [number, number] = [latitude, longitude];
          setUserLocation(userCoords);
          setMapCenter(userCoords);
          setZoom(DEFAULT_ZOOM);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setMapError('Could not get your location.');
          setSnackbarOpen(true);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setMapError('Geolocation is not supported by your browser.');
      setSnackbarOpen(true);
    }
  }, [userLocation]);

  // Get user's current location
  useEffect(() => {
    const initMap = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const userCoords: [number, number] = [latitude, longitude];
              setUserLocation(userCoords);
              setMapCenter(userCoords);
              setIsLoading(false);
            },
            (error) => {
              console.error('Error getting location:', error);
              setMapError('Could not get your location. Using default view.');
              setSnackbarOpen(true);
              setIsLoading(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        } else {
          setMapError('Geolocation is not supported by your browser. Using default view.');
          setSnackbarOpen(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Error initializing map. Please try again.');
        setSnackbarOpen(true);
        setIsLoading(false);
      }
    };

    initMap();
    
    // Cleanup function to cancel any pending geolocation requests
    return () => {
      // No cleanup needed for getCurrentPosition as it doesn't return a subscription
    };
  }, [setUserLocation, setMapCenter, setIsLoading, setMapError, setSnackbarOpen]);

  // Render loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Map Container */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <MapComponent 
          center={mapCenter}
          zoom={zoom}
          userLocation={userLocation}
        />
        
        {/* Recenter Button */}
        <Tooltip title="Recenter map on your location">
          <IconButton
            onClick={handleRecenter}
            disabled={isLoading}
            sx={{
              position: 'fixed',
              bottom: theme.spacing(2),
              right: theme.spacing(2),
              zIndex: 1000,
              backgroundColor: theme.palette.background.paper,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
              ...(isMobile && {
                bottom: theme.spacing(1),
                right: theme.spacing(1),
              }),
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} />
            ) : (
              <MyLocationIcon color="primary" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {mapError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MapPage;
