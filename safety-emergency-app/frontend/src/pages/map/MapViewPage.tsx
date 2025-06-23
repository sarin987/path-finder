import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L, { Icon } from 'leaflet';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

// Custom icons for roles
const icons: Record<string, Icon> = {
  police: new L.Icon({ iconUrl: '/icons/police.png', iconSize: [32, 32], iconAnchor: [16, 32] }),
  ambulance: new L.Icon({ iconUrl: '/icons/ambulance.png', iconSize: [32, 32], iconAnchor: [16, 32] }),
  fire: new L.Icon({ iconUrl: '/icons/fire.png', iconSize: [32, 32], iconAnchor: [16, 32] }),
  responder: new L.Icon({ iconUrl: '/icons/responder.png', iconSize: [32, 32], iconAnchor: [16, 32] }),
  user: new L.Icon({ iconUrl: '/icons/user-red.png', iconSize: [32, 32], iconAnchor: [16, 32] }),
  self: new L.Icon({ iconUrl: '/icons/self.png', iconSize: [36, 36], iconAnchor: [18, 36] }),
};

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://192.168.14.111:5000';

const headerHeight = 64; // px, adjust if your header is a different height

const initialCenter: LatLngExpression = [0, 0];

const MapViewPage: React.FC = () => {
  const { user } = useAuth();
  const [selfLocation, setSelfLocation] = useState<LatLngExpression | null>(null);
  const [helpUsers, setHelpUsers] = useState<any[]>([]);
  const [responders, setResponders] = useState<any[]>([]);
  const socketRef = useRef<any>(null);

  // Only render map after first location is set
  const [mapReady, setMapReady] = useState(false);

  // Only render map after first location is set and never change center after mount
  const [mapCenter, setMapCenter] = useState<LatLngExpression | null>(null);
  const [mapKey, setMapKey] = useState<number>(0);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setSelfLocation([pos.coords.latitude, pos.coords.longitude]);
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          setMapKey(Date.now()); // force new map instance on first location
          setMapReady(true);
        },
        () => {
          setSelfLocation([0, 0]);
          setMapCenter([0, 0]);
          setMapKey(Date.now());
          setMapReady(true);
        }
      );
    } else {
      setSelfLocation([0, 0]);
      setMapCenter([0, 0]);
      setMapKey(Date.now());
      setMapReady(true);
    }
  }, []);

  // Socket.IO for live updates
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    // Initial fetch
    socket.emit('get_locations');

    socket.on('locations_update', (data: { helpUsers: any[]; responders: any[] }) => {
      setHelpUsers(data.helpUsers || []);
      setResponders(data.responders || []);
    });

    // Optionally, poll every 5s for fallback
    const interval = setInterval(() => {
      socket.emit('get_locations');
    }, 5000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Helper to get icon by role
  const getIcon = (role: string = '', isSelf = false) => {
    if (isSelf) return icons.self;
    if (role && icons[role]) return icons[role];
    return icons.responder;
  };

  // Responsive map height
  const mapStyle = {
    width: '100vw',
    height: `calc(100vh - ${headerHeight}px)`,
    marginTop: 0,
    marginLeft: 0,
    zIndex: 1,
  } as React.CSSProperties;

  return (
    <div style={mapStyle}>
      {mapReady && mapCenter && (
        <MapContainer key={mapKey} center={mapCenter} zoom={13} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Current responder location */}
          {selfLocation && (
            <Marker position={selfLocation} icon={getIcon(user?.role, true)}>
              <Popup>
                <b>You ({user?.name || 'Responder'})</b>
              </Popup>
            </Marker>
          )}

          {/* Users needing help (red markers) */}
          {helpUsers.map((u, i) => (
            <Marker
              key={u.id || i}
              position={[u.latitude, u.longitude]}
              icon={icons.user}
            >
              <Popup>
                <b>{u.name || 'User'}</b><br />
                Needs help!
              </Popup>
            </Marker>
          ))}

          {/* Other responders */}
          {responders
            .filter(r => !selfLocation || r.id !== user?.id)
            .map((r, i) => (
              <Marker
                key={r.id || i}
                position={[r.latitude, r.longitude]}
                icon={getIcon(r.role)}
              >
                <Popup>
                  <b>{r.name || 'Responder'}</b><br />
                  Role: {r.role}
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      )}
    </div>
  );
};

export default MapViewPage;