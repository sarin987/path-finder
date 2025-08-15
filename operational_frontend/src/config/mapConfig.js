// Map configuration for OpenStreetMap
const MAP_TILE_PROVIDER = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const MAP_ATTRIBUTION = '© OpenStreetMap contributors';

// Map style for different themes
const MAP_STYLES = {
  light: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#f2f2f2' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#666666' }],
    },
  ],
  dark: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#1e1e1e' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ffffff' }],
    },
  ],
};

// Default map region
const DEFAULT_REGION = {
  latitude: 20.5937,  // Center of India
  longitude: 78.9629,
  latitudeDelta: 15,
  longitudeDelta: 15,
};

// Map padding for fit to coordinates
const MAP_PADDING = {
  top: 100,
  right: 50,
  bottom: 50,
  left: 50,
};

export {
  MAP_TILE_PROVIDER,
  MAP_ATTRIBUTION,
  MAP_STYLES,
  DEFAULT_REGION,
  MAP_PADDING,
};
