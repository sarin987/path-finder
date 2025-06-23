import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const MapCard = ({ userLocation, responders, onRecenter }) => (
  <View style={styles.card}>
    <MapView
      style={styles.map}
      initialRegion={{
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      showsUserLocation={false}
      showsMyLocationButton={false}
    >
      {/* User's current location marker with indicator */}
      {userLocation && (
        <Marker coordinate={userLocation} title="You">
          <View style={styles.userMarkerOuter}>
            <View style={styles.userMarkerInner} />
          </View>
        </Marker>
      )}
      {responders.map((r, i) => (
        <Marker
          key={r.id || i}
          coordinate={{ latitude: r.latitude, longitude: r.longitude }}
          title={r.name || r.role}
          description={r.role}
          pinColor={r.color || '#888'}
        />
      ))}
    </MapView>
    <TouchableOpacity style={styles.recenterBtn} onPress={onRecenter}>
      <MaterialIcons name="my-location" size={28} color="#1976D2" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  card: { borderRadius: 24, overflow: 'hidden', elevation: 6, backgroundColor: '#fff', margin: 8, height: 440 },
  map: { width: '100%', height: '100%' },
  recenterBtn: { position: 'absolute', bottom: 16, right: 16, backgroundColor: '#fff', borderRadius: 24, padding: 8, elevation: 4 },
  userMarkerOuter: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(25, 118, 210, 0.2)', alignItems: 'center', justifyContent: 'center' },
  userMarkerInner: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#1976D2', borderWidth: 2, borderColor: '#fff' },
});

export default MapCard;
