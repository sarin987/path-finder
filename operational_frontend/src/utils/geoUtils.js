/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula
 * @param {number} lat1 - Latitude of the first point
 * @param {number} lon1 - Longitude of the first point
 * @param {number} lat2 - Latitude of the second point
 * @param {number} lon2 - Longitude of the second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

/**
 * Sorts an array of locations by distance from a reference point
 * @param {Array} locations - Array of location objects with latitude and longitude
 * @param {Object} reference - Reference point with latitude and longitude
 * @returns {Array} Sorted array of locations
 */
export const sortByDistance = (locations, reference) => {
  if (!reference || !reference.latitude || !reference.longitude) {
    return locations;
  }

  return [...locations].sort((a, b) => {
    const distA = calculateDistance(
      reference.latitude,
      reference.longitude,
      a.latitude || a.lat || 0,
      a.longitude || a.lng || 0
    );

    const distB = calculateDistance(
      reference.latitude,
      reference.longitude,
      b.latitude || b.lat || 0,
      b.longitude || b.lng || 0
    );

    return distA - distB;
  });
};

/**
 * Filters locations within a specified radius from a reference point
 * @param {Array} locations - Array of location objects
 * @param {Object} reference - Reference point with latitude and longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} Filtered array of locations within the radius
 */
export const filterByDistance = (locations, reference, radiusKm) => {
  if (!reference || !reference.latitude || !reference.longitude) {
    return locations;
  }

  return locations.filter(location => {
    const distance = calculateDistance(
      reference.latitude,
      reference.longitude,
      location.latitude || location.lat || 0,
      location.longitude || location.lng || 0
    );
    return distance <= radiusKm;
  });
};

/**
 * Gets the bearing between two coordinates in degrees
 * @param {number} lat1 - Start latitude
 * @param {number} lon1 - Start longitude
 * @param {number} lat2 - End latitude
 * @param {number} lon2 - End longitude
 * @returns {number} Bearing in degrees (0-360)
 */
export const getBearing = (lat1, lon1, lat2, lon2) => {
  const startLat = lat1 * Math.PI / 180;
  const startLng = lon1 * Math.PI / 180;
  const destLat = lat2 * Math.PI / 180;
  const destLng = lon2 * Math.PI / 180;

  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x = Math.cos(startLat) * Math.sin(destLat) -
            Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);

  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

/**
 * Converts distance in kilometers to a human-readable string
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string (e.g., "1.2 km" or "450 m")
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

/**
 * Calculates the center point of multiple coordinates
 * @param {Array} coordinates - Array of {latitude, longitude} objects
 * @returns {Object} Center point {latitude, longitude}
 */
export const getCenter = (coordinates) => {
  if (!coordinates.length) {return null;}

  let x = 0;
  let y = 0;
  let z = 0;

  coordinates.forEach(coord => {
    const lat = (coord.latitude || coord.lat) * Math.PI / 180;
    const lng = (coord.longitude || coord.lng) * Math.PI / 180;

    x += Math.cos(lat) * Math.cos(lng);
    y += Math.cos(lat) * Math.sin(lng);
    z += Math.sin(lat);
  });

  const total = coordinates.length;
  x = x / total;
  y = y / total;
  z = z / total;

  const centerLng = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const centerLat = Math.atan2(z, hyp);

  return {
    latitude: centerLat * 180 / Math.PI,
    longitude: centerLng * 180 / Math.PI,
  };
};
