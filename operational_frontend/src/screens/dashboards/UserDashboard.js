import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  View,
  TextInput,
  Animated,
  Platform,
  Text,
  ActivityIndicator,
  Modal,
  Linking,
  ScrollView
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import io from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_ROUTES, SOCKET_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Geolocation from '@react-native-community/geolocation';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import EmergencyMenu from '../../components/EmergencyMenu';
import EmergencyMenuOption from '../../components/EmergencyMenuOption';

const DEFAULT_LOCATION = {
  latitude: 10.8505,
  longitude: 76.2711,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const UserDashboard = ({ navigation }) => {
  const mapRef = useRef(null);
  const { user, logout } = useAuth();
  
  const [location, setLocation] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);

  const [nearbyServices, setNearbyServices] = useState([]);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const sidebarAnimation = useRef(new Animated.Value(-300)).current;

  const handleEmergencyAccepted = async (data) => {
    try {
      // Update UI to show emergency service is on the way
      Alert.alert(
        'Emergency Accepted',
        `A ${data.type} service has accepted your request and is on the way.`,
        [{ text: 'OK' }]
      );

      // Update the markers on the map if needed
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }, 1000);
      }

      // Update emergency status
      setIsEmergencyActive(true);
    } catch (error) {
      console.error('Emergency acceptance error:', error);
      Alert.alert(
        'Error',
        'Failed to process emergency acceptance.',
        [{ text: 'OK' }]
      );
    }
  };

  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(API_ROUTES.socket, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        autoConnect: false
      });

      // Set up event listeners
      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        socketRef.current.emit('user_connected', { userId: user?.id });
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socketRef.current.on('location_update', updateNearbyService);
      socketRef.current.on('emergency_accepted', handleEmergencyAccepted);
      socketRef.current.on('emergency_completed', () => setIsEmergencyActive(false));

      // Connect the socket
      socketRef.current.connect();
    }

    return () => {
      if (socketRef.current) {
        // Remove event listeners
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('location_update');
        socketRef.current.off('emergency_accepted');
        socketRef.current.off('emergency_completed');
        
        // Close the socket connection
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [user?.id]);

  // Add a separate function to handle socket reconnection
  const reconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  const fetchNearbyServices = async (coords) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const isConnected = await NetInfo.fetch();
      if (!isConnected.isConnected) {
        throw new Error('No internet connection');
      }

      console.log('Fetching services with coords:', coords);
      
      const response = await fetch(`${API_ROUTES.services}/nearby`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: 5000,
          timestamp: new Date().getTime()
        })
      });

      const data = await response.json();
      console.log('Service response:', data);
      
      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || data.message || 'Server error');
      }

      if (!data.success) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      if (!data.services || !Array.isArray(data.services)) {
        throw new Error('Invalid response format');
      }

      // Store services in cache
      await AsyncStorage.setItem('lastServices', JSON.stringify(data.services));
      setNearbyServices(data.services);
      
    } catch (error) {
      console.error('Fetch services error:', error);
      
      // Try to use cached services
      try {
        const lastServices = await AsyncStorage.getItem('lastServices');
        if (lastServices) {
          const services = JSON.parse(lastServices);
          setNearbyServices(services);
        }
      } catch (storageError) {
        console.error('Storage error:', storageError);
      }
      
      Alert.alert(
        'Service Error',
        error.message || 'Failed to fetch nearby services. Please check your connection.',
        [
          { 
            text: 'Retry', 
            onPress: () => fetchNearbyServices(coords)
          },
          { 
            text: 'Use Offline Mode', 
            onPress: () => {
              setIsOfflineMode(true);
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  // Add retry mechanism
  const retryFetchWithBackoff = async (coords, attempt = 1, maxAttempts = 3) => {
    try {
      return await fetchNearbyServices(coords);
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return retryFetchWithBackoff(coords, attempt + 1, maxAttempts);
    }
  };

  useEffect(() => {
    // Start location tracking after login
    if (user?.id) {
      startLocationTracking();
    }
  }, [user?.id]);

  const startLocationTracking = async () => {
    try {
      setIsLocationLoading(true);
      setLocationError(null);

      // Request location permissions
      const permission = 
        Platform.OS === 'ios' 
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await request(permission);

      if (result !== RESULTS.GRANTED) {
        Alert.alert(
          'Permission Required',
          'Location permission is required to use this feature. Please enable it in your device settings.',
          [
            { 
              text: 'Settings', 
              onPress: () => Linking.openSettings(),
              style: 'default'
            },
            { 
              text: 'Cancel', 
              style: 'cancel'
            }
          ]
        );
        setIsLocationLoading(false);
        return;
      }

      // Get current position
      const position = await Geolocation.getCurrentPosition(
        (position) => {
          const coords = position.coords;
          setLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
          });
          setIsLocationLoading(false);
          fetchNearbyServices({
            latitude: coords.latitude,
            longitude: coords.longitude
          });
        },
        (error) => {
          setIsLocationLoading(false);
          setLocationError(error);
          console.error('Location error:', error);
          
          Alert.alert(
            'Location Error',
            error.message || 'Unable to get your location. Please try again.',
            [
              { 
                text: 'Retry', 
                onPress: () => startLocationTracking(),
                style: 'default'
              },
              { 
                text: 'Cancel', 
                style: 'cancel'
              }
            ]
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 1000
        }
      );

      // Start watching for location updates
      const watchId = Geolocation.watchPosition(
        (position) => {
          const coords = position.coords;
          setLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
          });
          fetchNearbyServices({
            latitude: coords.latitude,
            longitude: coords.longitude
          });
        },
        (error) => {
          console.error('Location update error:', error);
          setLocationError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 1000,
          distanceFilter: 10
        }
      );

      setIsLocationTracking(true);
      return () => {
        Geolocation.clearWatch(watchId);
        setIsLocationTracking(false);
      };
    } catch (error) {
      setIsLocationLoading(false);
      setLocationError(error);
      console.error('Location initialization error:', error);
      
      Alert.alert(
        'Location Error',
        error.message || 'Unable to get your location. Please try again.',
        [
          { 
            text: 'Retry', 
            onPress: () => startLocationTracking(),
            style: 'default'
          },
          { 
            text: 'Cancel', 
            style: 'cancel'
          }
        ]
      );
    }
  };

  const renderLocationButton = () => {
    return (
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => {
          if (isLocationTracking) {
            startLocationTracking();
          } else {
            // Center map on user's location
            if (location) {
              setLocation(location);
            }
          }
        }}
      >
        <View style={styles.buttonContent}>
          <MaterialCommunityIcons 
            name="crosshairs-gps" 
            size={24} 
            color={isLocationTracking ? '#4CAF50' : '#9E9E9E'}
          />
          <Text style={styles.buttonText}>My Location</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={toggleSidebar}>
        <View style={styles.buttonContent}>
          <MaterialCommunityIcons 
            name="menu" 
            size={24} 
            color="#333"
          />
          <Text style={styles.buttonText}>Menu</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color="#666" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search location..."
          placeholderTextColor="#666"
        />
      </View>
    </View>
  );

  const policeOptions = [
    { type: 'chat', icon: 'chat', color: '#4CAF50', label: 'Chat with Police', action: 'start chat' },
    { type: 'share', icon: 'share-variant', color: '#2196F3', label: 'Share Location', action: 'share location' },
    { type: 'call', icon: 'phone', color: '#FF9800', label: 'Call Nearest Station', action: 'call station' },
    { type: 'thanks', icon: 'heart', color: '#E91E63', label: 'Thank Police', action: 'send thank you' }
  ];

  const ambulanceOptions = [
    { type: 'chat', icon: 'chat', color: '#4CAF50', label: 'Chat with Ambulance', action: 'start chat' },
    { type: 'share', icon: 'share-variant', color: '#2196F3', label: 'Share Location', action: 'share location' },
    { type: 'call', icon: 'phone', color: '#FF9800', label: 'Call Ambulance', action: 'call ambulance' },
    { type: 'thanks', icon: 'heart', color: '#E91E63', label: 'Thank Ambulance', action: 'send thank you' }
  ];

  const fireOptions = [
    { type: 'chat', icon: 'chat', color: '#4CAF50', label: 'Chat with Fire Brigade', action: 'start chat' },
    { type: 'share', icon: 'share-variant', color: '#2196F3', label: 'Share Location', action: 'share location' },
    { type: 'call', icon: 'phone', color: '#FF9800', label: 'Call Fire Brigade', action: 'call fire brigade' },
    { type: 'thanks', icon: 'heart', color: '#E91E63', label: 'Thank Fire Brigade', action: 'send thank you' }
  ];

  const parentsOptions = [
    { type: 'share', icon: 'share-variant', color: '#2196F3', label: 'Share Location', action: 'share location' },
    { type: 'call', icon: 'phone', color: '#FF9800', label: 'Call Parents', action: 'call parents' },
    { type: 'alert', icon: 'alert', color: '#E91E63', label: 'Send Alert', action: 'send alert' },
    { type: 'zone', icon: 'map-marker-radius', color: '#4CAF50', label: 'Set Safe Zone', action: 'set safe zone' }
  ];

  const [emergencyMenu, setEmergencyMenu] = useState(null);

  const handleEmergencyMenu = (type) => {
    if (isEmergencyActive) return;
    setEmergencyMenu(type);
  };

  const renderEmergencyPanel = () => (
    <>
      <View style={styles.leftEmergencyPanel}>
        <TouchableOpacity 
          style={[styles.emergencyButton, { backgroundColor: '#4A90E2' }]}
          onPress={() => handleEmergencyMenu('police')}
          disabled={isEmergencyActive}
        >
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons name="police-badge" size={20} color="white" />
            <Text style={styles.emergencyButtonText}>Police</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.emergencyButton, { backgroundColor: '#D0021B' }]}
          onPress={() => handleEmergencyMenu('ambulance')}
          disabled={isEmergencyActive}
        >
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons name="ambulance" size={20} color="white" />
            <Text style={styles.emergencyButtonText}>Ambulance</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.rightEmergencyPanel}>
        <TouchableOpacity 
          style={[styles.emergencyButton, { backgroundColor: '#F5A623' }]}
          onPress={() => handleEmergencyMenu('fire')}
          disabled={isEmergencyActive}
        >
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons name="fire-truck" size={20} color="white" />
            <Text style={styles.emergencyButtonText}>Fire Brigade</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.emergencyButton, { backgroundColor: '#7ED321' }]}
          onPress={() => handleEmergencyMenu('parents')}
          disabled={isEmergencyActive}
        >
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons name="account-multiple" size={20} color="white" />
            <Text style={styles.emergencyButtonText}>Parents</Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );

  const handleEmergencyRequest = async (type) => {
    try {
      const response = await fetch('http://localhost:5000/api/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          userId: user?.id,
          location,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send emergency request');
      }

      Alert.alert('Request Sent', 'Your emergency request has been sent successfully.');
    } catch (error) {
      console.error('Error sending emergency request:', error);
      Alert.alert('Error', 'Failed to send emergency request. Please try again.');
    }
  };

  const renderEmergencyMenu = () => {
    if (!emergencyMenu) return null;

    const optionsMap = {
      police: [
        { type: 'chat', icon: 'chat', color: '#4CAF50', label: 'Chat with Police', action: () => handleEmergencyRequest('chat') },
        { type: 'share', icon: 'share-variant', color: '#2196F3', label: 'Share Location', action: () => handleEmergencyRequest('share') },
        { type: 'call', icon: 'phone', color: '#FF9800', label: 'Call Nearest Station', action: () => handleEmergencyRequest('call') },
        { type: 'thanks', icon: 'heart', color: '#E91E63', label: 'Thank Police', action: () => handleEmergencyRequest('thanks') },
        { type: 'cancel', icon: 'close', color: '#9E9E9E', label: 'Cancel', action: () => setEmergencyMenu(null) },
      ],
      ambulance: [
        { type: 'chat', icon: 'chat', color: '#4CAF50', label: 'Chat with Ambulance', action: () => handleEmergencyRequest('chat') },
        { type: 'share', icon: 'share-variant', color: '#2196F3', label: 'Share Location', action: () => handleEmergencyRequest('share') },
        { type: 'call', icon: 'phone', color: '#FF9800', label: 'Call Ambulance', action: () => handleEmergencyRequest('call') },
        { type: 'thanks', icon: 'heart', color: '#E91E63', label: 'Thank Ambulance', action: () => handleEmergencyRequest('thanks') },
        { type: 'cancel', icon: 'close', color: '#9E9E9E', label: 'Cancel', action: () => setEmergencyMenu(null) },
      ],
      fire: [
        { type: 'chat', icon: 'chat', color: '#4CAF50', label: 'Chat with Fire Brigade', action: () => handleEmergencyRequest('chat') },
        { type: 'share', icon: 'share-variant', color: '#2196F3', label: 'Share Location', action: () => handleEmergencyRequest('share') },
        { type: 'call', icon: 'phone', color: '#FF9800', label: 'Call Fire Brigade', action: () => handleEmergencyRequest('call') },
        { type: 'thanks', icon: 'heart', color: '#E91E63', label: 'Thank Fire Brigade', action: () => handleEmergencyRequest('thanks') },
        { type: 'cancel', icon: 'close', color: '#9E9E9E', label: 'Cancel', action: () => setEmergencyMenu(null) },
      ],
      parents: [
        { type: 'share', icon: 'share-variant', color: '#2196F3', label: 'Share Location', action: () => handleEmergencyRequest('share') },
        { type: 'call', icon: 'phone', color: '#FF9800', label: 'Call Parents', action: () => handleEmergencyRequest('call') },
        { type: 'alert', icon: 'alert', color: '#E91E63', label: 'Send Alert', action: () => handleEmergencyRequest('alert') },
        { type: 'zone', icon: 'map-marker-radius', color: '#4CAF50', label: 'Set Safe Zone', action: () => handleEmergencyRequest('zone') },
        { type: 'cancel', icon: 'close', color: '#9E9E9E', label: 'Cancel', action: () => setEmergencyMenu(null) },
      ],
    };

    const options = optionsMap[emergencyMenu] || [];

    return (
      <Modal
        transparent={true}
        animationType="slide"
        visible={!!emergencyMenu}
        onRequestClose={() => setEmergencyMenu(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Emergency Options</Text>
            <ScrollView contentContainerStyle={styles.modalBody}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.modalOption, { backgroundColor: option.color }]}
                  onPress={option.action}
                >
                  <MaterialCommunityIcons name={option.icon} size={28} color="white" />
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const updateNearbyService = (data) => {
    setNearbyServices(prev => ({
      ...prev,
      [data.type]: prev[data.type]?.map(service =>
        service.id === data.id ? { ...service, location: data.location } : service
      ) || []
    }));
  };

  const handleLocationChange = async (newLocation) => {
    setLocation(newLocation);
    await fetchNearbyServices(newLocation);
  };

  const handleLogout = async () => {
    try {
      // Disconnect socket before logout
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      await logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert(
        'Error',
        'Failed to logout. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEmergency = async (type) => {
    if (isEmergencyActive) {
      Alert.alert(
        'Active Emergency',
        'You already have an active emergency request. Do you want to cancel it?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: () => cancelEmergency(type)
          }
        ]
      );
      return;
    }
  
    Alert.alert(
      'Emergency Alert',
      `Requesting ${type} service. Do you want to proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed',
          onPress: () => sendEmergencyRequest(type)
        }
      ]
    );
  };

  const sendEmergencyRequest = async (type) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Emit socket event for real-time tracking
      socketRef.current?.emit('emergency_request', {
        type,
        location,
        userId: user?.id,
      });
  
      // Also send HTTP request for persistence
      const response = await fetch(`${API_ROUTES.emergency}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          location,
          userId: user?.id,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to send emergency request');
      }
  
      setIsEmergencyActive(true);
      Alert.alert(
        'Emergency Request Sent',
        'Help is on the way. Stay calm and remain at your location.',
        [{ text: 'OK' }]
      );
  
    } catch (error) {
      console.error('Emergency request error:', error);
      Alert.alert(
        'Error',
        'Failed to send emergency request. Please try again or call emergency services directly.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const cancelEmergency = async (type) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      socketRef.current?.emit('emergency_cancel', {
        type,
        userId: user?.id,
      });
  
      const response = await fetch(`${API_ROUTES.emergency}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          userId: user?.id,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to cancel emergency request');
      }
  
      setIsEmergencyActive(false);
      Alert.alert('Emergency Cancelled', 'Your emergency request has been cancelled.');
  
    } catch (error) {
      console.error('Emergency cancellation error:', error);
      Alert.alert(
        'Error',
        'Failed to cancel emergency request. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -300 : 0;
    Animated.timing(sidebarAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderMap = () => {
    if (!location) {
      return null;
    }

    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={location}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          followsUserLocation={true}
          loadingEnabled={true}
          showsBuildings={true}
          showsTraffic={true}
          showsIndoors={true}
          showsPointsOfInterest={true}
          showsIndoorLevelPicker={true}
        >
          {nearbyServices.map((service, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: service.location.lat,
                longitude: service.location.lng
              }}
              title={service.name}
              description={service.description}
            >
              <MaterialCommunityIcons 
                name="storefront" 
                size={32} 
                color="#4CAF50"
              />
            </Marker>
          ))}
        </MapView>
        {renderLocationButton()}
      </View>
    );
  };

  const renderOfflineMode = () => {
    if (!isOfflineMode) return null;
    
    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={location}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          followsUserLocation={true}
          loadingEnabled={true}
          showsBuildings={true}
          showsTraffic={true}
          showsIndoors={true}
          showsPointsOfInterest={true}
          showsIndoorLevelPicker={true}
        >
          {nearbyServices.map((service, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: service.location.lat,
                longitude: service.location.lng
              }}
              title={service.name}
              description={service.description}
            >
              <MaterialCommunityIcons 
                name="storefront" 
                size={32} 
                color="#4CAF50"
              />
            </Marker>
          ))}
        </MapView>
        {renderLocationButton()}
      </View>
    );
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        {renderMap()}
        {renderOfflineMode()}
        {renderHeader()}
        <Sidebar
          user={user}
          role={user?.role || 'user'}
          sidebarAnimation={sidebarAnimation}
          toggleSidebar={toggleSidebar}
          navigation={navigation}
          logout={handleLogout}
        />
        {renderEmergencyPanel()}
      </SafeAreaView>

      {renderEmergencyMenu()}

      {isSidebarOpen && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={toggleSidebar}
          activeOpacity={1}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 1,
  },
  searchBar: {
    flex: 1,
    height: 45,
    backgroundColor: 'white',
    borderRadius: 22,
    marginHorizontal: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  leftEmergencyPanel: {
    position: 'absolute',
    left: 16,
    bottom: '25%',
    justifyContent: 'space-between',
    height: 70,
  },
  rightEmergencyPanel: {
    position: 'absolute',
    right: 16,
    bottom: '25%',
    justifyContent: 'space-between',
    height: 70,
  },
  emergencyButton: {
    width: 100,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  offlineMode: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    zIndex: 1000,
  },
  offlineText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    minWidth: 100,
    minHeight: 36,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  modalBody: {
    width: '100%',
    alignItems: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    height: 60, // Ensure consistent height for all options
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalOptionText: {
    marginLeft: 15,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  emergencyMenusContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
  },
  emergencyMenuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
});

export default UserDashboard;
