import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Alert,
  Linking,
  Text,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from '@react-native-community/geolocation';
import { useAuth } from '../../contexts/AuthContext';
import useResponderLocations from '../../hooks/useResponderLocations';
import { 
  MapView, 
  ResponderList, 
  LocationPermission,
  formatLocationData
} from '../../components/map';
import { socketManager } from '../../utils/socket';

const INITIAL_REGION = {
  latitude: 10.8505,
  longitude: 76.2711,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const UserDashboard = () => {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const mapViewRef = useRef(null);
  const watchIdRef = useRef(null);
  
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [mapRegion, setMapRegion] = useState(INITIAL_REGION);
  
  const {
    responders = [],
    loading: respondersLoading,
    error: respondersError,
    refresh: refreshResponders,
  } = useResponderLocations(user?.token, !!user?.token);
  
  const formattedResponders = useMemo(() => {
    if (!userLocation) return [];
    return formatLocationData(responders, userLocation);
  }, [responders, userLocation]);
  
  const handleRegionChange = useCallback((region) => {
    setMapRegion(region);
  }, []);
  
  const navigation = useNavigation();
  
  const handleMarkerPress = useCallback((responder) => {
    if (!responder) {
      console.error('No responder data provided');
      return;
    }
    
    console.log('Responder data:', JSON.stringify({
      id: responder.id,
      name: responder.name,
      role: responder.role,
      latitude: responder.latitude,
      longitude: responder.longitude
    }, null, 2));
    
    // Show action sheet with options
    Alert.alert(
      responder.name || 'Responder',
      `What would you like to do with ${responder.name || 'this responder'}?`,
      [
        {
          text: 'View on Map',
          onPress: () => {
            if (mapViewRef.current && responder.latitude && responder.longitude) {
              mapViewRef.current.animateToRegion({
                latitude: responder.latitude,
                longitude: responder.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            } else {
              Alert.alert('Error', 'Could not view responder on map: Missing location data');
            }
          }
        },
        {
          text: 'Start Chat',
          onPress: () => {
            if (!responder.id) {
              Alert.alert('Error', 'Cannot start chat: Missing responder ID');
              return;
            }
            
            console.log('Navigating to chat with responder:', {
              id: responder.id,
              name: responder.name || 'Responder',
              role: responder.role || 'responder'
            });
            
            navigation.navigate('Chat', { 
              responder: {
                id: String(responder.id), // Ensure ID is a string
                name: responder.name || 'Responder',
                role: responder.role || 'responder'
              } 
            });
          }
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, [navigation]);
  
  const handleMapReady = useCallback(() => {
    if (userLocation && mapViewRef.current) {
      mapViewRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [userLocation]);
  
  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show nearby responders.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          setShowPermissionDialog(true);
          return false;
        }
      } catch (err) {
        console.warn('Error requesting location permission:', err);
        return false;
      }
    }
    return true;
  }, []);
  
  const startWatchingLocation = useCallback(async () => {
    if (!isMounted) return;
    
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;
      
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
      
      const position = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
      
      if (position?.coords) {
        const { latitude, longitude, accuracy } = position.coords;
        const location = { latitude, longitude, accuracy };
        
        setUserLocation(location);
        setLoading(false);
        
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...location,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }
      
      watchIdRef.current = Geolocation.watchPosition(
        (position) => {
          if (position?.coords) {
            const { latitude, longitude, accuracy } = position.coords;
            setUserLocation({ latitude, longitude, accuracy });
          }
        },
        (error) => {
          console.error('Error watching position:', error);
          setError('Error getting your location');
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 10000,
          fastestInterval: 5000,
        }
      );
      
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Unable to get your location');
      setLoading(false);
    }
  }, [requestLocationPermission]);
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    return () => {
      setIsMounted(false);
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Start watching location after component is mounted and we have a user token
  useEffect(() => {
    if (isMounted && user?.token) {
      startWatchingLocation();
    }
  }, [isMounted, user?.token, startWatchingLocation]);
  
  const handleRefresh = useCallback(async () => {
    console.log('Refreshing data...');
    try {
      setError(null);
      setLoading(true);
      await refreshResponders();
      await startWatchingLocation();
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [refreshResponders, startWatchingLocation]);

  if (loading || respondersLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading map and responders...</Text>
        <Text 
          style={styles.retryText}
          onPress={handleRefresh}
        >
          Taking too long? Tap to retry
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF6B6B" style={styles.errorIcon} />
        <Text style={styles.errorText}>{error}</Text>
        <Text 
          style={styles.retryText}
          onPress={handleRefresh}
        >
          Tap to retry
        </Text>
        {!userLocation && (
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => {
              setShowPermissionDialog(true);
              setError(null);
            }}
          >
            <Text style={styles.settingsButtonText}>Open Location Settings</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.mapContainer}>
        <MapView
          ref={mapViewRef}
          region={mapRegion}
          onRegionChangeComplete={handleRegionChange}
          userLocation={userLocation}
          responders={formattedResponders}
          onMarkerPress={handleMarkerPress}
          onMapReady={handleMapReady}
        />
        
        <View style={styles.responderListContainer}>
          <ResponderList 
            responders={formattedResponders} 
            onResponderPress={handleMarkerPress}
          />
        </View>
      </View>
      
      {showPermissionDialog && (
        <LocationPermission 
          onRequestPermission={requestLocationPermission}
          onDismiss={() => setShowPermissionDialog(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  responderListContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    padding: 8,
  },
  settingsButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    width: '80%',
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserDashboard;