// Define the config interface
type AppConfig = {
  API_URL: string;
  GOOGLE_MAPS_API_KEY: string;
  WS_URL: string;
  MAP_DEFAULTS: {
    center: {
      lat: number;
      lng: number;
    };
    zoom: number;
  };
}

// Define the config object
const config: AppConfig = {
  // API Configuration
  API_URL: process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL}${process.env.REACT_APP_API_URL.endsWith('/') ? '' : '/'}api`
    : 'http://192.168.14.111/api',
    
  // Google Maps Configuration
  GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  
  // WebSocket Configuration
  WS_URL: process.env.REACT_APP_WS_URL || 'ws://192.168.14.111',
  
  // Map Defaults
  MAP_DEFAULTS: {
    center: {
      lat: 12.9716, // Default to a central location (e.g., city center)
      lng: 77.5946,
    },
    zoom: 12,
  }
};

// Export the config object and type
export type { AppConfig };
export default config;
