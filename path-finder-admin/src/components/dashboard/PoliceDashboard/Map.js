import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Box, Typography, Card, CardContent, Stack } from '@mui/material';
import { FaMapMarkerAlt, FaUserCircle } from 'react-icons/fa';

const Map = ({ locations, activeUsers }) => {
  // Calculate center based on active locations
  const calculateCenter = (locations) => {
    if (!locations || locations.length === 0) {
      return { lat: 12.9716, lng: 77.5946 }; // Default to Bangalore
    }

    const lats = locations.map(loc => loc.latitude);
    const lngs = locations.map(loc => loc.longitude);
    
    const latCenter = lats.reduce((a, b) => a + b, 0) / locations.length;
    const lngCenter = lngs.reduce((a, b) => a + b, 0) / locations.length;
    
    return { lat: latCenter, lng: lngCenter };
  };

  const center = calculateCenter(locations);

  return (
    <Box sx={{ height: '400px', width: '100%' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Emergency Locations */}
        {locations?.map((location, index) => (
          <Marker key={index} position={{ lat: location.latitude, lng: location.longitude }}>
            <Popup>
              <Card>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="h6" gutterBottom>
                      <FaMapMarkerAlt className="mr-1" />
                      Emergency Location
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {location.address || 'Location not available'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {location.status || 'Active'}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Popup>
            <Circle
              center={{ lat: location.latitude, lng: location.longitude }}
              radius={500}
              color="#ff4444"
              fillColor="#ff4444"
              fillOpacity={0.1}
            />
          </Marker>
        ))}

        {/* Active Users */}
        {activeUsers?.map((user, index) => (
          <Marker 
            key={`user-${index}`}
            position={{ lat: user.latitude, lng: user.longitude }}
            icon={{
              iconUrl: '/user-marker.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            }}
          >
            <Popup>
              <Card>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="h6" gutterBottom>
                      <FaUserCircle className="mr-1" />
                      {user.name || 'User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Phone: {user.phone || 'Not available'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {user.status || 'Active'}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

export default Map;