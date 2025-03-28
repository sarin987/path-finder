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
import { API_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_LOCATION = {
  latitude: 10.8505,
  longitude: 76.2711,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const UserDashboard = ({ navigation }) => {
  const mapRef = useRef(null);
  const socketRef = useRef(null);
  const { user, logout } = useAuth();
  
  // State
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(-300)).current;

  // Socket connection
  useEffect(() => {
    socketRef.current = io(API_URL);
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('location_update', (data) => {
      updateNearbyService(data);
    });

    socketRef.current.on('emergency_accepted', (data) => {
      Alert.alert(
        'Help is Coming',
        `A ${data.type} unit has been dispatched to your location. ETA: ${data.eta} minutes.`
      );
    });

    socketRef.current.on('emergency_completed', () => {
      setIsEmergencyActive(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const updateNearbyService = (data) => {
    setNearbyServices(prev => ({
      ...prev,
      [data.type]: prev[data.type]?.map(service =>
        service.id === data.id ? { ...service, location: data.location } : service
      ) || []
    }));
  };

  const fetchNearbyServices = async (coords) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/services/nearby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: 5000, // 5km radius
          types: ['hospital', 'police', 'ambulance', 'pharmacy']
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nearby services');
      }

      const data = await response.json();
      setNearbyServices(data.services);
    } catch (error) {
      console.error('Fetch services error:', error);
      Alert.alert(
        'Error',
        'Failed to fetch nearby services. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLocationChange = async (newLocation) => {
    setLocation(newLocation);
    await fetchNearbyServices(newLocation);
  };

  const handleLogout = async () => {
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
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
      const response = await fetch(`${API_URL}/emergency/request`, {
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
  
      const response = await fetch(`${API_URL}/emergency/cancel`, {
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
