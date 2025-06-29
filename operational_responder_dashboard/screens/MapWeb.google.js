import React from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: 12,
  margin: 12,
};

const MapWeb = ({ userLocation, responders, incidents, onIncidentSelect }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // <-- Replace with your key
  });

  const center = userLocation
    ? { lat: userLocation.lat, lng: userLocation.lng }
    : { lat: 20.5937, lng: 78.9629 };

  return isLoaded ? (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
      {responders.map(r => (
        <Marker key={r.id} position={{ lat: r.lat, lng: r.lng }} />
      ))}
      {incidents.map(incident => (
        <Marker
          key={incident.id}
          position={{ lat: incident.location.lat, lng: incident.location.lng }}
          onClick={() => onIncidentSelect(incident)}
        />
      ))}
    </GoogleMap>
  ) : <div>Loading...</div>;
};

export default MapWeb;
