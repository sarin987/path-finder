import React from 'react';
import { Platform, View, Text } from 'react-native';

// Platform-safe MapNative: Only loads native map code on native, never on web

// Export a different file for web and native using the "react-native" resolver
// This file is MapNative.js. Create MapNative.web.js for web.

let MapNative;

if (Platform.OS === 'web') {
  // On web, render a placeholder or nothing
  MapNative = ({ userLocation, responders, incidents, onIncidentSelect }) => (
    <View style={{ width: '100%', maxWidth: 700, height: 260, backgroundColor: '#e6eaf0', borderRadius: 16, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <Text style={{ position: 'absolute', left: 16, bottom: 8, color: '#888', fontSize: 16 }}>Map not available on web</Text>
      <View style={{ position: 'absolute', top: 90, left: 320, backgroundColor: '#e74c3c', borderRadius: 24, width: 48, height: 48, justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>SOS</Text>
      </View>
    </View>
  );
} else {
  // On native, load react-native-maps only here
  const MapView = require('react-native-maps').default;
  const Marker = require('react-native-maps').Marker;
  MapNative = ({ userLocation, responders, incidents, onIncidentSelect }) => {
    const initialRegion = userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 10, longitudeDelta: 10 };
    return (
      <MapView style={{ flex: 1, borderRadius: 12, margin: 12 }} initialRegion={initialRegion} showsUserLocation={!!userLocation}>
        {responders && responders.map(r => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.lat, longitude: r.lng }}
            pinColor="blue"
            title={r.name}
            description={r.role}
          />
        ))}
        {incidents && incidents.map(incident => (
          <Marker
            key={incident.id}
            coordinate={{ latitude: incident.location.lat, longitude: incident.location.lng }}
            pinColor="red"
            title={incident.type}
            description={`Time: ${incident.time || ''}`}
            onPress={() => onIncidentSelect && onIncidentSelect(incident)}
          />
        ))}
      </MapView>
    );
  };
}

// Remove setPersistence from services/firebase.js! Only set it in AuthContext.js.
// This ensures persistence is set before any auth state is checked.

export default MapNative;
