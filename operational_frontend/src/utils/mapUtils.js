/**
 * Calculates the distance between two coordinates in kilometers
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

/**
 * Calculates the bounding box coordinates for a given center point and radius
 * @param {Object} center - { latitude, longitude }
 * @param {number} radiusInKm - Radius in kilometers
 * @returns {Object} Bounding box coordinates { minLat, maxLat, minLng, maxLng }
 */
export const getBoundingBox = (center, radiusInKm) => {
  const latDelta = radiusInKm / 111; // Approximately 1 degree = 111km
  const lngDelta = radiusInKm / (111 * Math.cos(center.latitude * (Math.PI / 180)));
  
  return {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLng: center.longitude - lngDelta,
    maxLng: center.longitude + lngDelta
  };
};

/**
 * Formats distance for display
 * @param {number} distanceInKm - Distance in kilometers
 * @returns {string} Formatted distance (e.g., "1.2 km" or "850 m")
 */
export const formatDistance = (distanceInKm) => {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)} m`;
  }
  return `${distanceInKm.toFixed(1)} km`;
};

/**
 * Gets the appropriate icon for a responder role
 * @param {string} role - Responder role (e.g., 'police', 'ambulance', 'fire')
 * @returns {Object} Icon configuration { name, color }
 */
export const getResponderIcon = (role) => {
  const icons = {
    police: {
      name: 'security',
      color: '#3F51B5', // Blue
      label: 'Police'
    },
    ambulance: {
      name: 'local-hospital',
      color: '#E91E63', // Pink
      label: 'Ambulance'
    },
    fire: {
      name: 'local-fire-department',
      color: '#F44336', // Red
      label: 'Fire'
    },
    default: {
      name: 'location-on',
      color: '#4CAF50', // Green
      label: 'Responder'
    }
  };

  return icons[role?.toLowerCase()] || icons.default;
};

/**
 * Calculates the center point of multiple coordinates
 * @param {Array} coordinates - Array of { latitude, longitude } objects
 * @returns {Object} Center point { latitude, longitude }
 */
export const getCenterPoint = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  let x = 0;
  let y = 0;
  let z = 0;
  let total = 0;

  coordinates.forEach(coord => {
    if (coord && typeof coord.latitude === 'number' && typeof coord.longitude === 'number') {
      const lat = coord.latitude * Math.PI / 180;
      const lng = coord.longitude * Math.PI / 180;
      
      x += Math.cos(lat) * Math.cos(lng);
      y += Math.cos(lat) * Math.sin(lng);
      z += Math.sin(lat);
      total++;
    }
  });

  if (total === 0) return null;

  x = x / total;
  y = y / total;
  z = z / total;

  const centerLng = Math.atan2(y, x);
  const centerLat = Math.atan2(z, Math.sqrt(x * x + y * y));

  return {
    latitude: centerLat * 180 / Math.PI,
    longitude: centerLng * 180 / Math.PI
  };
};

/**
 * Calculates the bounds that would fit all markers
 * @param {Array} markers - Array of marker coordinates { latitude, longitude }
 * @param {number} padding - Padding in degrees
 * @returns {Object} Region object { latitude, longitude, latitudeDelta, longitudeDelta }
 */
export const getRegionForCoordinates = (markers, padding = 0.1) => {
  if (!markers || markers.length === 0) {
    return null;
  }

  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;

  // Find the bounds
  markers.forEach(marker => {
    if (marker && typeof marker.latitude === 'number' && typeof marker.longitude === 'number') {
      minLat = Math.min(minLat, marker.latitude);
      maxLat = Math.max(maxLat, marker.latitude);
      minLng = Math.min(minLng, marker.longitude);
      maxLng = Math.max(maxLng, marker.longitude);
    }
  });

  // Calculate deltas
  const latitudeDelta = (maxLat - minLat) + padding;
  const longitudeDelta = (maxLng - minLng) + padding;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta
  };
};
