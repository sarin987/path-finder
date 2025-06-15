interface AppConfig {
  api: {
    baseURL: string;
    timeout: number;
  };
  app: {
    name: string;
    version: string;
    environment: string;
  };
  features: {
    enableNotifications: boolean;
    enableAnalytics: boolean;
  };
  map: {
    defaultCenter: {
      lat: number;
      lng: number;
    };
    defaultZoom: number;
    apiKey?: string;
  };
}

const config: AppConfig = {
  api: {
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 30000, // 30 seconds
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Safety Emergency App',
    version: import.meta.env.VITE_APP_VERSION || '0.1.0',
    environment: import.meta.env.VITE_APP_ENV || 'development',
  },
  features: {
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },
  map: {
    defaultCenter: {
      lat: 20.5937, // Center of India
      lng: 78.9629,
    },
    defaultZoom: 5,
    apiKey: import.meta.env.VITE_MAP_API_KEY,
  },
};

export default config;
