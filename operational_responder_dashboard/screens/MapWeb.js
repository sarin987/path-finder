import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css'; // <-- REMOVE this import for Expo/Metro/React Native Web

// NOTE: For correct map styling, add the following to your public/index.html or web HTML template:
// <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />

const MapWeb = ({ userLocation = { lat: 20.5937, lng: 78.9629 }, responders = [], incidents = [], onIncidentSelect = () => {} }) => {
  console.log('[MapWeb] Rendering with', { userLocation, responders, incidents });
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [20.5937, 78.9629];
  return (
    <div style={{ height: 400, width: '100%', borderRadius: 12, margin: 12 }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {Array.isArray(responders) && responders.map(r => (
          <Marker key={r.id} position={[r.lat, r.lng]}>
            <Popup>
              {typeof r.name === 'string' && typeof r.role === 'string' ? (
                <span>{r.name} ({r.role})</span>
              ) : (
                <span>Responder</span>
              )}
            </Popup>
          </Marker>
        ))}
        {Array.isArray(incidents) && incidents.map(incident => (
          <Marker
            key={incident.id}
            position={incident.location && incident.location.lat && incident.location.lng ? [incident.location.lat, incident.location.lng] : [20.5937, 78.9629]}
            eventHandlers={{ click: () => onIncidentSelect(incident) }}
          >
            <Popup>
              {typeof incident.type === 'string' ? <b>{incident.type}</b> : <b>Incident</b>}<br />
              Time: {incident.time || 'Unknown'}<br />
              <button onClick={() => onIncidentSelect(incident)}>Accept/Help</button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapWeb;
