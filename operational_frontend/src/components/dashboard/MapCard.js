import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import MapView from 'react-native-maps';
// Import Marker separately for web compatibility
let Marker;
if (Platform.OS === 'web') {
  Marker = require('react-native-maps').Marker;
} else {
  Marker = require('react-native-maps').Marker;
}
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Helper function to get role color
const getRoleColor = (role) => {
  const colors = {
    police: '#1976D2',
    ambulance: '#43A047',
    fire: '#E53935',
    parent: '#FBC02D',
  };
  return colors[role] || '#888';
};

// Helper function to get role icon
const getRoleIcon = (role) => {
  const icons = {
    police: 'local-police',
    ambulance: 'local-hospital',
    fire: 'local-fire-department',
    parent: 'supervisor-account',
  };
  return icons[role] || 'person-pin';
};

const MapCard = ({
  userLocation,
  responders = [],
  onRecenter,
  loading = false,
  error = null,
}) => {
  // Show loading state only if userLocation is not available
  if (!userLocation) {
    return (
      <View style={[styles.card, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#128090" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  // Show error state only if there's an error and no userLocation
  if (error && !userLocation) {
    return (
      <View style={[styles.card, styles.errorContainer]}>
        <MaterialIcons name="error-outline" size={48} color="#E53935" />
        <Text style={styles.errorText}>Unable to load map: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <MapView
        style={[styles.map, { borderRadius: 24 }]}
        region={{
          ...userLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
      >
        {/* User's current location marker with indicator */}
        {userLocation && (
          <Marker coordinate={userLocation} title="You">
            <View style={styles.userMarkerOuter}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Responder markers */}
        {responders
          .filter(responder => responder.lat && responder.lng)
          .map((responder, index) => (
            <Marker
              key={responder.userId || `responder-${index}`}
              coordinate={{
                latitude: parseFloat(responder.lat),
                longitude: parseFloat(responder.lng),
              }}
              title={responder.name || `Responder ${responder.role}`}
              description={responder.role}
            >
              <View style={[
                styles.responderMarker,
                { backgroundColor: getRoleColor(responder.role) },
              ]}>
                <MaterialIcons
                  name={getRoleIcon(responder.role)}
                  size={20}
                  color="#fff"
                />
              </View>
            </Marker>
          ))}
      </MapView>

      <TouchableOpacity style={styles.recenterBtn} onPress={onRecenter}>
        <MaterialIcons name="my-location" size={28} color="#1976D2" />
      </TouchableOpacity>

      {/* Small spinner in top-right if loading responders */}
      {loading && (
        <View style={styles.responderSpinner}>
          <ActivityIndicator size="small" color="#128090" />
        </View>
      )}
      {/* Small error icon in top-right if responder error */}
      {error && (
        <View style={styles.responderErrorIcon}>
          <MaterialIcons name="error-outline" size={22} color="#E53935" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    elevation: 6,
    backgroundColor: '#fff',
    margin: 8,
    height: 440,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    elevation: 4,
  },
  userMarkerOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(25, 118, 210, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1976D2',
    borderWidth: 2,
    borderColor: '#fff',
  },
  responderMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#128090',
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: '#E53935',
    textAlign: 'center',
    fontSize: 16,
  },
  responderSpinner: {
    position: 'absolute',
    top: 12,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 4,
    zIndex: 10,
  },
  responderErrorIcon: {
    position: 'absolute',
    top: 12,
    right: 48,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 4,
    zIndex: 10,
  },
});

export default MapCard;
