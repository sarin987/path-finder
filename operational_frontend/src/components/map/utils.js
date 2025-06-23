// Helper function to calculate distance between two coordinates in km
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos((lat1 * Math.PI / 180)) * Math.cos((lat2 * Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Calculate ETA based on distance and average speed (km/h)
export const calculateETA = (distanceKm, avgSpeedKmH = 40) => {
  const hours = distanceKm / avgSpeedKmH;
  const minutes = Math.ceil(hours * 60);
  return `${minutes} min`;
};

// Get appropriate icon for responder type
export const getResponderIcon = (role) => {
  const icons = {
    police: require('../../assets/icons/police-car.png'),
    ambulance: require('../../assets/icons/ambulance.png'),
    fire: require('../../assets/icons/fire-truck.png'),
    default: require('../../assets/icons/responder.png'),
  };
  return icons[role] || icons.default;
};

// Format location data from API response
export const formatLocationData = (data, userLocation = null) => {
  if (!data || !Array.isArray(data)) return [];
  
  return data
    .filter(responder => responder && responder.lat && responder.lng)
    .map(responder => {
      const location = {
        id: responder.user_id?.toString() || 'unknown',
        name: responder.user?.name || `Responder ${responder.user_id || 'unknown'}`,
        role: responder.role || 'default',
        latitude: parseFloat(responder.lat),
        longitude: parseFloat(responder.lng),
        status: responder.status || 'available',
        lastUpdated: responder.updated_at || new Date().toISOString(),
      };

      // Calculate distance and ETA if user location is available
      if (userLocation) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          location.latitude,
          location.longitude
        );
        return {
          ...location,
          distance,
          eta: calculateETA(distance)
        };
      }
      
      return location;
    });
};
