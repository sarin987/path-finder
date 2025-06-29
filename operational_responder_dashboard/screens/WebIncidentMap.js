import React from 'react';

// This component is only used on web
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const WebIncidentMap = ({ incidents }) => {
  // Default to India center
  const center = incidents.length > 0 && incidents[0].location
    ? [incidents[0].location.lat, incidents[0].location.lng]
    : [20.5937, 78.9629];

  return (
    <div style={{ height: 400, width: '100%', borderRadius: 12, margin: 12 }}>
      <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {incidents.map((incident) => (
          incident.location && (
            <Marker key={incident.id} position={[incident.location.lat, incident.location.lng]}>
              <Popup>
                <b>{incident.role}</b><br/>
                Status: {incident.status}
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
};

export default WebIncidentMap;
