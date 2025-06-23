import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
const headerHeight = 64; // px, adjust if your header is a different height
const mapContainerStyle = {
  width: '100vw',
  height: `calc(100vh - ${headerHeight}px)`
};
const defaultCenter = { lat: 0, lng: 0 };

// Role-based marker icons
const getIcon = (role: string, isSelf = false) => {
  if (isSelf) return '/icons/self.png';
  if (role === 'police') return '/icons/police.png';
  if (role === 'ambulance') return '/icons/ambulance.png';
  if (role === 'fire') return '/icons/fire.png';
  if (role === 'user') return '/icons/user-red.png';
  return '/icons/responder.png';
};

const GoogleMapPage: React.FC = () => {
  const { user } = useAuth();
  const [selfLocation, setSelfLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [helpUsers, setHelpUsers] = useState<any[]>([]);
  const [responders, setResponders] = useState<any[]>([]);
  const socketRef = useRef<any>(null);

  // Google Maps API loader
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  });

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setSelfLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setSelfLocation(defaultCenter)
      );
    } else {
      setSelfLocation(defaultCenter);
    }
  }, []);

  // Socket.IO for live updates
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('get_locations');
    socket.on('locations_update', (data: { helpUsers: any[]; responders: any[] }) => {
      setHelpUsers(data.helpUsers || []);
      setResponders(data.responders || []);
    });
    const interval = setInterval(() => {
      socket.emit('get_locations');
    }, 5000);
    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={mapContainerStyle}>
      {isLoaded && selfLocation && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={selfLocation}
          zoom={13}
        >
          {/* Current responder location */}
          <Marker
            position={selfLocation}
            icon={getIcon(user?.role || '', true)}
            title={`You (${user?.name || 'Responder'})`}
          />
          {/* Users needing help (red markers) */}
          {helpUsers.map((u, i) => (
            <Marker
              key={u.id || i}
              position={{ lat: u.latitude, lng: u.longitude }}
              icon={getIcon('user')}
              title={u.name || 'User'}
            />
          ))}
          {/* Other responders */}
          {responders
            .filter(r => !selfLocation || r.id !== user?.id)
            .map((r, i) => (
              <Marker
                key={r.id || i}
                position={{ lat: r.latitude, lng: r.longitude }}
                icon={getIcon(r.role)}
                title={r.name || 'Responder'}
              />
            ))}
        </GoogleMap>
      )}
    </div>
  );
};

export default GoogleMapPage;
