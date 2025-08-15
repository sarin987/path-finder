import React, { useEffect, useRef, useState } from 'react';
import { View, Platform, ActivityIndicator } from 'react-native';
import { alert } from '../utils/alert';
import axios from 'axios';
import io from 'socket.io-client';
import { getPermissionsAndroid, getGeolocation, isWeb } from '../utils/platform';

// Platform-specific imports for maps
let MapView, Marker, PROVIDER_GOOGLE;
if (isWeb()) {
  // For web, use react-native-web-maps
  const WebMaps = require('react-native-web-maps').default;
  MapView = WebMaps;
  Marker = WebMaps.Marker || (() => null); // Fallback to null if Marker is not available
  PROVIDER_GOOGLE = 'google'; // Default provider for web
} else {
  // For native, use react-native-maps
  const ReactNativeMaps = require('react-native-maps');
  MapView = ReactNativeMaps.default;
  Marker = ReactNativeMaps.Marker;
  PROVIDER_GOOGLE = ReactNativeMaps.PROVIDER_GOOGLE;
}

const SOCKET_URL = process.env.REACT_NATIVE_SOCKET_URL || 'http://localhost:5000';
const API_URL = process.env.REACT_NATIVE_API_URL || 'http://localhost:5000/api';

const INITIAL_REGION = {
  latitude: 10.8505,
  longitude: 76.2711,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const ResponderMap = () => {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  // Request location permission (Android)
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const PermissionsAndroid = getPermissionsAndroid();
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs access to your location to show nearby responders.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        alert('Permission error', err.message);
        return false;
      }
    }
    return true;
  };

  // Get user location
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      const Geolocation = getGeolocation();
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        error => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // Fetch responders from backend
  const fetchResponders = async () => {
    try {
      const res = await axios.get(`${API_URL}/locations/roles`);
      setResponders(res.data || []);
    } catch (err) {
      setResponders([]);
    }
  };

  // Setup on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLoading(false);
        return;
      }
      try {
        const loc = await getUserLocation();
        setUserLocation(loc);
        await fetchResponders();
        setLoading(false);
        // Center map
        if (mapRef.current && loc) {
          mapRef.current.animateToRegion({ ...loc, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 1000);
        }
      } catch (err) {
        setLoading(false);
        alert('Location error', 'Could not get your location.');
      }
    })();
  }, []);

  // Real-time responder updates
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('responder_location_update', (data) => {
      setResponders(data);
    });
    return () => { socket.disconnect(); };
  }, []);

  if (loading || !userLocation) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#2196F3" /></View>;
  }

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={{ flex: 1 }}
      initialRegion={{ ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      showsUserLocation={true}
    >
      {responders.map((responder, idx) => (
        <Marker
          key={responder.id || idx}
          coordinate={{ latitude: responder.latitude, longitude: responder.longitude }}
          title={responder.name || 'Responder'}
          description={responder.role || ''}
          pinColor={responder.role === 'police' ? 'blue' : responder.role === 'ambulance' ? 'green' : 'red'}
        />
      ))}
    </MapView>
  );
};

export default ResponderMap;
