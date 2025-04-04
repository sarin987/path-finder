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
} from 'react-native';
import io from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import EmergencyMap from '../../components/EmergencyMap';
import Sidebar from '../../components/Sidebar';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_ROUTES, SOCKET_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '../../hooks/useLocation';
import { useSocket } from '../../hooks/useSocket';

const DEFAULT_LOCATION = {
  latitude: 10.8505,
  longitude: 76.2711,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const UserDashboard = ({ navigation }) => {
  const mapRef = useRef(null);
  const { user, logout } = useAuth();
  
  const { location, setLocation } = useLocation(DEFAULT_LOCATION);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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

  const socket = useSocket(SOCKET_URL, {
    connect: () => {
      console.log('Socket connected');
      socketRef.current = socket;
    },
    disconnect: () => {
      console.log('Socket disconnected');
      socketRef.current = null;
    },
    location_update: updateNearbyService,
    emergency_accepted: handleEmergencyAccepted,
    emergency_completed: () => setIsEmergencyActive(false)
  });

  const fetchNearbyServices = async (coords) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
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

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Server error');
      }

      const data = await response.json();
      console.log('Received services:', data);

      if (!data.services || !Array.isArray(data.services)) {
        throw new Error('Invalid response format');
      }

      setNearbyServices(data.services);
      
    } catch (error) {
      console.error('Fetch services error:', error);
      
      if (error.message.includes('Network request failed')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to server. Please check your internet connection.',
          [
            { 
              text: 'Retry', 
              onPress: () => fetchNearbyServices(coords)
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to fetch nearby services',
          [
            { 
              text: 'Retry', 
              onPress: () => fetchNearbyServices(coords)
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
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

  // Update useEffect to use retry mechanism
  useEffect(() => {
    retryFetchWithBackoff(location).catch(error => {
      console.error('All retry attempts failed:', error);
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [location]);

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

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={toggleSidebar}>
        <MaterialCommunityIcons name="menu" size={24} color="#000" />
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

  const renderEmergencyPanel = () => (
    <>
      <View style={styles.leftEmergencyPanel}>
        <TouchableOpacity 
          style={[styles.emergencyButton, { backgroundColor: '#4A90E2' }]}
          onPress={() => handleEmergency('police')}
        >
          <MaterialCommunityIcons name="police-badge" size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.emergencyButton, { backgroundColor: '#D0021B' }]}
          onPress={() => handleEmergency('ambulance')}
        >
          <MaterialCommunityIcons name="ambulance" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.rightEmergencyPanel}>
        <TouchableOpacity 
          style={[styles.emergencyButton, { backgroundColor: '#F5A623' }]}
          onPress={() => handleEmergency('fire')}
        >
          <MaterialCommunityIcons name="fire-truck" size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.emergencyButton, { backgroundColor: '#7ED321' }]}
          onPress={() => handleEmergency('sos')}
        >
          <MaterialCommunityIcons name="alert-circle" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <EmergencyMap
        ref={mapRef}
        onLocationChange={handleLocationChange}
        initialLocation={location}
        mapPadding={{ top: 80, right: 0, bottom: 0, left: 0 }}
        nearbyServices={nearbyServices}
      />
      
      {renderHeader()}
      {renderEmergencyPanel()}
      <Sidebar
        user={user}
        role={user?.role || 'user'}
        sidebarAnimation={sidebarAnimation}
        toggleSidebar={toggleSidebar}
        navigation={navigation}
        logout={handleLogout}
      />
      {isSidebarOpen && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={toggleSidebar}
          activeOpacity={1}
        />
      )}
    </SafeAreaView>
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
    bottom: '15%',
    justifyContent: 'space-between',
    height: 110,
  },
  rightEmergencyPanel: {
    position: 'absolute',
    right: 16,
    bottom: '15%',
    justifyContent: 'space-between',
    height: 110,
  },
  emergencyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
});

export default UserDashboard;
