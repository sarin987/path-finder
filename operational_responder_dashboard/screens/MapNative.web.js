import React from 'react';
import { View, Text } from 'react-native';

// This file is ONLY for web. It never loads any native code or modules.
// For correct map styling, add this to your public/index.html or web HTML template:
// <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />

export default function MapNative({ userLocation, responders, incidents, onIncidentSelect }) {
  return (
    <View style={{ width: '100%', maxWidth: 700, height: 260, backgroundColor: '#e6eaf0', borderRadius: 16, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <Text style={{ position: 'absolute', left: 16, bottom: 8, color: '#888', fontSize: 16 }}>Map not available on web</Text>
      <View style={{ position: 'absolute', top: 90, left: 320, backgroundColor: '#e74c3c', borderRadius: 24, width: 48, height: 48, justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>SOS</Text>
      </View>
    </View>
  );
}
