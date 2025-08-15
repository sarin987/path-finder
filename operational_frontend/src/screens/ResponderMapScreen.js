import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapView from '../components/map/MapView';
import { useFirestoreResponders } from '../hooks/useFirestoreResponders';
import { getCurrentLocation, requestLocationPermission } from '../utils/locationUtils';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDistance } from '../utils/mapUtils';

const ResponderMapScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10); // in kilometers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResponder, setSelectedResponder] = useState(null);

  // Get user's current location
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        setLoading(true);
        const hasPermission = await requestLocationPermission();

        if (!hasPermission) {
          setError('Location permission denied');
          setLoading(false);
          return;
        }

        const location = await getCurrentLocation();
        setUserLocation(location);
        setError(null);
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Could not get your location');
      } finally {
        setLoading(false);
      }
    };

    getUserLocation();
  }, []);

  // Get nearby responders
  const { responders, loading: respondersLoading } = useFirestoreResponders(
    userLocation || { latitude: 0, longitude: 0 },
    searchRadius,
    ['police', 'ambulance', 'fire']
  );

  // Handle responder marker press
  const handleMarkerPress = (responder) => {
    setSelectedResponder(responder);
  };

  // Center map on user's location
  const centerOnUser = async () => {
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...location,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0922 * (width / height),
        }, 500);
      }
    } catch (err) {
      console.error('Error centering on user:', err);
    }
  };

  // Toggle search radius
  const toggleSearchRadius = () => {
    setSearchRadius(prev => prev === 5 ? 10 : prev === 10 ? 20 : 5);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F51B5" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        userLocation={userLocation}
        showNearbyResponders={true}
        searchRadius={searchRadius}
        onMarkerPress={handleMarkerPress}
        onRespondersUpdate={(responders) => {
          // Update UI based on responders if needed
        }}
        style={styles.map}
      />

      {/* Search radius control */}
      <TouchableOpacity
        style={styles.radiusButton}
        onPress={toggleSearchRadius}
      >
        <MaterialIcons name="my-location" size={20} color="#3F51B5" />
        <Text style={styles.radiusButtonText}>
          {searchRadius} km
        </Text>
      </TouchableOpacity>

      {/* Center on user button */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={centerOnUser}
      >
        <MaterialIcons name="gps-fixed" size={24} color="#3F51B5" />
      </TouchableOpacity>

      {/* Responder info panel */}
      {selectedResponder && (
        <View style={styles.infoPanel}>
          <View style={styles.infoHeader}>
            <MaterialIcons
              name={getResponderIcon(selectedResponder.role).name}
              size={24}
              color={getResponderIcon(selectedResponder.role).color}
            />
            <Text style={styles.responderName}>
              {selectedResponder.role?.toUpperCase() || 'RESPONDER'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedResponder(null)}
            >
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance:</Text>
            <Text style={styles.infoValue}>
              {formatDistance(selectedResponder.distance || 0)} away
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: selectedResponder.online ? '#4CAF50' : '#9E9E9E' },
            ]}>
              <Text style={styles.statusText}>
                {selectedResponder.online ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Handle action (e.g., call, message, navigate)
              console.log('Action for:', selectedResponder.id);
            }}
          >
            <Text style={styles.actionButtonText}>
              {selectedResponder.role === 'ambulance' ? 'REQUEST HELP' : 'CONTACT'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const { width, height } = require('react-native').Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3F51B5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  radiusButton: {
    position: 'absolute',
    top: 24,
    right: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  radiusButtonText: {
    marginLeft: 4,
    fontWeight: 'bold',
    color: '#3F51B5',
  },
  centerButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: 'white',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  responderName: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#3F51B5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ResponderMapScreen;
