import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Update user's location
export const updateLocation = async (token: string, role: string, lat: number, lng: number) => {
  try {
    const response = await axios.post(
      `${API_URL}/location/update`,
      { role, lat, lng },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

// Get locations for a specific role
export interface LocationResponse {
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

export const getRoleLocations = async (token: string, role: string): Promise<LocationResponse[]> => {
  try {
    const response = await axios.get<LocationResponse[]>(`${API_URL}/location/${role}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching role locations:', error);
    throw error;
  }
};

// Track user's location and update periodically
export const startLocationTracking = (
  token: string,
  role: string,
  onLocationUpdate: (location: { lat: number; lng: number }) => void
) => {
  if (!navigator.geolocation) {
    console.error('Geolocation is not supported by your browser');
    return () => {}; // Return empty cleanup function
  }

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      
      // Call the callback with the new location
      onLocationUpdate({ lat, lng });
      
      // Update the server
      try {
        await updateLocation(token, role, lat, lng);
      } catch (error) {
        console.error('Failed to update location on server:', error);
      }
    },
    (error) => {
      console.error('Error getting location:', error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    }
  );

  // Return cleanup function to stop watching
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
};
