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
  Text
} from 'react-native';
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

// Default map region (will be updated with user's location)
const INITIAL_REGION = {
  latitude: 10.8505,
  longitude: 76.2711,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const UserDashboard = ({ navigation }) => {
  // Auth context
  const { user } = useAuth();
  
  // Refs
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);
  
  // State
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [mapRegion, setMapRegion] = useState(INITIAL_REGION);
  
  // Use the useResponderLocations hook
  const {
    responders = [],
    loading: respondersLoading,
    error: respondersError,
    socketConnected,
    refresh: refreshResponders,
  } = useResponderLocations(user?.token, !!user?.token);
  
  // Format responders with distance and ETA
  const formattedResponders = useMemo(() => {
    if (!userLocation) return [];
    
    return formatLocationData(responders, userLocation);
  }, [responders, userLocation]);
  
  // Handle map region change
  const handleRegionChange = useCallback((region) => {
    setMapRegion(region);
  }, []);
  
  // Handle marker press
  const handleMarkerPress = useCallback((responder) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: responder.latitude,
        longitude: responder.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, []);
  
  // Handle map ready
  const handleMapReady = useCallback(() => {
    if (userLocation) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [userLocation]);
  
  // Request location permission
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
          },
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
    return true; // For iOS, we handle permissions differently
  }, []);
  
  // Start watching user's location
  const startWatchingLocation = useCallback(async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;
      
      // Clear any existing watcher
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
      
      // Get current position first
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
        
        // Center map on user location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...location,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }
      
      // Set up watcher for continuous updates
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
          distanceFilter: 10, // Update every 10 meters
          interval: 10000, // Update every 10 seconds
          fastestInterval: 5000, // Fastest update interval
        }
      );
      
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Unable to get your location');
      setLoading(false);
    }
  }, [requestLocationPermission]);
  
  // Initialize location tracking
  useEffect(() => {
    if (user?.token) {
      startWatchingLocation();
    }
    
    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [user?.token, startWatchingLocation]);
  
  // Handle refresh
  const handleRefresh = useCallback(() => {
    refreshResponders();
    startWatchingLocation();
  }, [refreshResponders, startWatchingLocation]);

  // Render the main component
  if (loading || respondersLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading map and responders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text 
          style={styles.retryText}
          onPress={handleRefresh}
        >
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Main Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          region={mapRegion}
          onRegionChangeComplete={handleRegionChange}
          userLocation={userLocation}
          responders={formattedResponders}
          onMarkerPress={handleMarkerPress}
          onMapReady={handleMapReady}
        />
        
        {/* Responder List Overlay */}
        <View style={styles.responderListContainer}>
          <ResponderList 
            responders={formattedResponders} 
            onResponderPress={handleMarkerPress}
          />
        </View>
      </View>
      
      {/* Location Permission Dialog */}
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default UserDashboard;
          if (position?.coords) {
            console.log('Got position:', position);
            console.log('Location acquired - Lat:', position.coords.latitude, 
              'Lng:', position.coords.longitude, 
              'Accuracy:', position.coords.accuracy + 'm');
            cleanup();
            resolve(position);
          }
        };

        const onError = (error) => {
          attempts++;
          console.error(`Location attempt ${attempts}/${MAX_ATTEMPTS} failed:`, error);
          
          if (attempts >= MAX_ATTEMPTS) {
            console.warn('Max location attempts reached');
            cleanup();
            resolve(null);
          } else {
            // Try again with different settings
            console.log(`Retrying location (${attempts}/${MAX_ATTEMPTS})...`);
            setError(`Getting location (${attempts}/${MAX_ATTEMPTS} attempts)...`);
            
            // Clear any existing watchers
            cleanup();
            
            // Try with different accuracy settings
            const retryOptions = {
              enableHighAccuracy: attempts % 2 === 0, // Alternate between high and low accuracy
              timeout: 10000,
              maximumAge: attempts * 5000, // Increase cache tolerance with each retry
              distanceFilter: 10, // Small distance filter to get updates
            };
            
            console.log(`Retry attempt ${attempts} with options:`, retryOptions);
            
            // Start a new watch with updated options
            watchId = Geolocation.watchPosition(
              onSuccess,
              onError,
              retryOptions
            );
            
            // Also try a single position update
            Geolocation.getCurrentPosition(
              onSuccess,
              onError,
              retryOptions
            );
          }
        };

        // Initial position request
        const options = {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
          distanceFilter: 0
        };

        console.log('Starting position request with options:', options);
        watchId = Geolocation.watchPosition(onSuccess, onError, options);
        Geolocation.getCurrentPosition(onSuccess, onError, options);
        
        // Set a timeout to prevent hanging
        timeoutId = setTimeout(() => {
          console.warn('Location request timed out');
          cleanup();
          resolve(null);
        }, 30000);
      });

      if (position?.coords) {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('Final location acquired - Lat:', latitude, 'Lng:', longitude, 'Accuracy:', accuracy + 'm');
        
        // Update user location state
        setUserLocation({ 
          latitude, 
          longitude, 
          accuracy,
          timestamp: new Date().toISOString() 
        });
        
        // Center map on user location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
        
        // Refresh responders
        refreshResponders();
        
        return { latitude, longitude, accuracy };
      } else {
        setError('Unable to determine your location. Please try again.');
        return null;
      }
    } catch (err) {
      console.error('Error getting location:', err);
      setError('Error getting location. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshResponders, requestLocationPermission]);oregroundGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to provide emergency services',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        console.log('Foreground permission result:', foregroundGranted);

        if (foregroundGranted === PermissionsAndroid.RESULTS.GRANTED) {
          // For Android 10+ (API 29+), request background location separately
          if (Platform.Version >= 29) {
            console.log('Android 10+: Requesting background location permission...');
            const backgroundGranted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
              {
                title: 'Background Location',
                message: 'This app needs access to your location even when closed to provide emergency services',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              },
            );
            console.log('Background permission result:', backgroundGranted);
            return backgroundGranted === PermissionsAndroid.RESULTS.GRANTED;
          }
          return true;
        }
        
        if (foregroundGranted === PermissionsAndroid.RESULTS.DENIED) {
          console.log('Location permission denied');
          return new Promise((resolve) => {
            Alert.alert(
              'Permission Required',
              'Location permission is required for this app to function properly. Please enable it in your app settings.',
              [
                { 
                  text: 'Open Settings', 
                  onPress: () => {
                    Linking.openSettings();
                    resolve(false);
                  } 
                },
                { 
                  text: 'Cancel', 
                  style: 'cancel',
                  onPress: () => {
                    console.log('User cancelled permission request');
                    resolve(false);
                  } 
                }
              ],
              { cancelable: true, onDismiss: () => resolve(false) }
            );
          });
        }
        
        return false;
      } else {
        // For iOS, use the permissions API
        console.log('iOS: Requesting location permission...');
        const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        console.log('iOS permission result:', result);
        return result === RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      return new Promise((resolve) => {
        Alert.alert(
          'Error',
          'Failed to request location permission. Please try again.',
          [
            { 
              text: 'OK',
              onPress: () => {
                console.log('User acknowledged location permission error');
                resolve(false);
              }
            }
          ],
          { cancelable: true, onDismiss: () => resolve(false) }
        );
      });
        
        const onSuccess = (position) => {
          if (position?.coords) {
            console.log('Got position:', position);
            console.log('Location acquired - Lat:', position.coords.latitude, 
              'Lng:', position.coords.longitude, 
              'Accuracy:', position.coords.accuracy + 'm');
            cleanup();
            resolve(position);
          }
        };
        
        const onError = (error) => {
          attempts++;
          console.error(`Location attempt ${attempts}/${MAX_ATTEMPTS} failed:`, error);
          
          if (attempts >= MAX_ATTEMPTS) {
            console.warn('Max location attempts reached');
            cleanup();
            resolve(null);
          } else {
            // Try again with different settings
            console.log(`Retrying location (${attempts}/${MAX_ATTEMPTS})...`);
            setError(`Getting location (${attempts}/${MAX_ATTEMPTS} attempts)...`);
            
            // Clear any existing watchers
            cleanup();
            
            // Try with different accuracy settings
            const retryOptions = {
              enableHighAccuracy: attempts % 2 === 0, // Alternate between high and low accuracy
              timeout: 10000,
              maximumAge: attempts * 5000, // Increase cache tolerance with each retry
              distanceFilter: 10, // Small distance filter to get updates
            };
            
            console.log(`Retry attempt ${attempts} with options:`, retryOptions);
            
            // Start a new watch with updated options
            watchId = Geolocation.watchPosition(
              onSuccess,
              onError,
              retryOptions
            );
            
            // Also try a single position update
            Geolocation.getCurrentPosition(
              onSuccess,
              onError,
              retryOptions
            );
          }
        };
        
        // Set a timeout to prevent hanging if location can't be acquired
        timeoutId = setTimeout(() => {
          console.warn('Location request timed out');
          cleanup();
          resolve(null);
        }, 30000); // 30 second overall timeout
        
        // Initial position request options
        const options = {
          enableHighAccuracy: true,  // Start with high accuracy
          timeout: 15000,           // 15 second timeout for initial request
          maximumAge: 0,            // Don't use cached position
          distanceFilter: 10,       // 10 meters
        };
        
        console.log('Starting position request with options:', options);
        
        // Start watching for position updates
        watchId = Geolocation.watchPosition(
          onSuccess,
          onError,
          options
        );
        
        // Also try to get a single position update
        Geolocation.getCurrentPosition(
          onSuccess, 
          onError, 
          options
        );
      });
      
      if (!position || !position.coords) {
        // More detailed error handling
        const errorMsg = 'Could not determine your location. Please check the following:\n\n' +
          '1. Ensure location services are enabled in your device settings\n' +
          '2. Make sure you have a clear view of the sky (GPS works best outdoors)\n' +
          '3. Try moving to a different location\n' +
          '4. Restart your device if the issue persists';
        
        console.warn('Failed to get location after multiple attempts');
        setError('Location unavailable. Please check your settings.');
        
        // Show a more helpful alert to the user
        Alert.alert(
          'Location Unavailable',
          errorMsg,
          [
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'android') {
                  Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
                } else {
                  Linking.openSettings();
                }
              },
            },
            {
              text: 'Try Again',
              onPress: () => {
                console.log('User requested to retry location');
                getUserLocation();
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        
        return null;
      }
      
      const { latitude, longitude, accuracy } = position.coords;
      console.log(`Location acquired - Lat: ${latitude}, Lng: ${longitude}, Accuracy: ${accuracy}m`);
      
      const newLocation = { 
        latitude, 
        longitude,
        accuracy,
        timestamp: new Date().toISOString()
      };
      
      setUserLocation(newLocation);
      
      // Center map on user's location with animation
      if (mapRef.current) {
        console.log('Centering map on location:', newLocation);
        const region = {
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          latitudeDelta: 0.005, // Zoom in more for better accuracy
          longitudeDelta: 0.005,
        };
        
        try {
          // First try animateToRegion
          mapRef.current.animateToRegion(region, 1000);
          
          // Then set the region to ensure it sticks
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.animateToRegion(region, 1000);
            }
          }, 100);
          
          // Add a marker for the user's location
          setUserLocationMarker({
            coordinate: {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            },
            title: 'Your Location',
            description: `Accuracy: ${newLocation.accuracy.toFixed(2)} meters`,
            pinColor: '#3498db', // Blue color for user location
          });
          
        } catch (err) {
          console.warn('Error animating to region:', err);
          // Fallback to simple region setting
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }, 1000);
          }
        }
      }
      
      // Refresh responders when we get a new location
      if (refreshResponders) {
        try {
          console.log('Refreshing responders after location update...');
          await refreshResponders();
        } catch (err) {
          // Only log the error if it's not the expected "Hook is disabled" message
          if (!err.message || !err.message.includes('Hook is disabled')) {
            console.error('Error refreshing responders:', err);
          } else {
            console.log('Responder refresh skipped - not authenticated');
          }
          // Don't reject the entire location update if refresh fails
        }
      } else {
        console.log('Skipping responder refresh - refresh function not available');
      }
      
      setError(null);
      return newLocation;
    } catch (err) {
      const errorMsg = `Could not get your location: ${err.message || 'Unknown error'}`;
      console.error(errorMsg, err);
      setError('Error getting location. Please try again.');
      
      // Show a user-friendly error message
      Alert.alert(
        'Location Error',
        'We encountered an error while trying to access your location. Please try again or check your device settings.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              console.log('User requested to retry location after error');
              getUserLocation();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          }
        ]
      );
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshResponders, requestLocationPermission, mapRef, setError, setLoading]);

  // Format responders for display
  const formattedResponders = useMemo(() => {
    try {
      // Check if we can use cached location
      if (userLocation?.timestamp) {
        const now = new Date();
        const lastUpdate = new Date(userLocation.timestamp);
        const minutesSinceLastUpdate = (now - lastUpdate) / (1000 * 60);
        
        if (minutesSinceLastUpdate < 1) {
          console.log(`Using cached location from ${minutesSinceLastUpdate.toFixed(1)} minutes ago`);
        }
      }
      
      return formatResponders(responders || [], userLocation || INITIAL_REGION);
    } catch (err) {
      console.error('Error formatting responders:', err);
      return [];
    }
  }, [responders, userLocation, formatResponders]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    if (refreshResponders) {
      refreshResponders().finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [refreshResponders]);

  // Get initial location on mount
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Render map markers for responders
  const renderResponderMarkers = useCallback(() => {
    if (respondersLoading || !formattedResponders) {
      return null;
    }
    
    return formattedResponders.map((responder) => (
      <Marker
        key={`responder-${responder.id}`}
        coordinate={{
          latitude: responder.latitude,
          longitude: responder.longitude,
        }}
        title={responder.name}
        description={`${responder.role.charAt(0).toUpperCase() + responder.role.slice(1)} • ${responder.distance.toFixed(1)} km • ETA: ${responder.eta}`}
      >
        <Image
          source={responderIcons[responder.role] || responderIcons.default}
          style={[
            styles.responderIcon,
            responder.status === 'busy' && styles.responderBusy
          ]}
          resizeMode="contain"
        />
      </Marker>
    ));
  }, [formattedResponders, respondersLoading]);

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Map View */}
      <View style={styles.mapContainer}>
        {respondersError && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={16} color="#fff" style={styles.errorIcon} />
            <Text style={styles.errorText}>{respondersError}</Text>
          </View>
        )}
        
        {!socketConnected && (
          <View style={styles.offlineBanner}>
            <Ionicons name="wifi-outline" size={14} color="#fff" />
            <Text style={styles.offlineText}>Reconnecting to live updates...</Text>
          </View>
        )}
        
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={INITIAL_REGION}
            showsUserLocation={true}
            showsMyLocationButton={true}
            followsUserLocation={true}
            showsCompass={true}
            showsTraffic={true}
            loadingEnabled={true}
            loadingIndicatorColor="#1a73e8"
            loadingBackgroundColor="#f8f9fa"
            moveOnMarkerPress={true}
            rotateEnabled={true}
            scrollEnabled={true}
            zoomEnabled={true}
            pitchEnabled={true}
            onMapReady={() => {
              console.log('Map is ready');
              setMapReady(true);
              // Request location when map is ready
              getUserLocation();
            }}
            onUserLocationChange={(e) => {
              if (e.nativeEvent.coordinate) {
                const { latitude, longitude, accuracy } = e.nativeEvent.coordinate;
                console.log('User location updated:', { latitude, longitude, accuracy });
                setUserLocation({ latitude, longitude, accuracy });
                
                // Center map on user location
                if (mapRef.current) {
                  mapRef.current.animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  });
                }
              }
            }}
          >
            {renderResponderMarkers()}
          </MapView>
        </View>
        
        {/* Refresh Button */}
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color="#1a73e8" 
            style={refreshing ? styles.refreshingIcon : null} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Error banner */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={16} color="#fff" style={{marginRight: 5}} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
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
    color: '#757575',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },
  errorBanner: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
  },
  errorIcon: {
    marginRight: 5,
  },
  offlineBanner: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    padding: 8,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 1000,
  },
  refreshingIcon: {
    transform: [{ rotate: '360deg' }],
  },
  responderIcon: {
    width: 40,
    height: 40,
  },
  responderBusy: {
    opacity: 0.6,
  },
  refreshingIcon: {
    transform: [{ rotate: '360deg' }],
  },
  responderIcon: {
    width: 40,
    height: 40,
  }
});

export default UserDashboard;
