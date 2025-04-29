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
import MapView, { Marker, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_ROUTES, SOCKET_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Geolocation from '@react-native-community/geolocation';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import EmergencyMenu from '../../components/EmergencyMenu';
import EmergencyMenuOption from '../../components/EmergencyMenuOption';
import IncidentReportForm from '../../components/IncidentReportForm';
import IncidentMap from '../../components/IncidentMap';
import TrustedContacts from '../../components/TrustedContacts';
import EmergencyAlertButton from '../../components/EmergencyAlertButton';
import HealthMonitor from '../../components/HealthMonitor';
import RiskPredictionMap from '../../components/RiskPredictionMap';
import AgencyCollaborationPanel from '../../components/AgencyCollaborationPanel';
import SafeRouteSuggester from '../../components/SafeRouteSuggester';
import ResourceAvailabilityPanel from '../../components/ResourceAvailabilityPanel';
import CheckInPanel from '../../components/CheckInPanel';
import EmergencyCallPanel from '../../components/EmergencyCallPanel';
import { fetchActiveUsers, markLoginActivity, markLogoutActivity } from '../../api/activeUsers';

const DEFAULT_LOCATION = {
  latitude: 10.8505,
  longitude: 76.2711,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const featureToContacts = {
  reportIncident: ['police', 'fire', 'ambulance', 'parents', 'trustedContacts'],
  trustedContacts: ['parents', 'trustedContacts'],
  healthMonitor: ['ambulance', 'parents'],
  emergencyAlert: ['police', 'ambulance', 'fire', 'parents'],
  nearbyIncidents: [],
  safeRoute: [],
  resourceAvailability: [],
  agencyCollaboration: ['police', 'fire', 'ambulance'],
  checkIn: ['parents', 'trustedContacts'],
  emergencyCall: ['userSelect'],
};

const getContactLabels = (featureKey) => {
  const mapping = {
    police: 'Police',
    fire: 'Fire Brigade',
    ambulance: 'Ambulance',
    parents: 'Parents',
    trustedContacts: 'Trusted Contacts',
    userSelect: 'Choose Service',
  };
  return (featureToContacts[featureKey] || [])
    .map(c => mapping[c] || c)
    .join(', ');
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
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);

  const [selectedMenu, setSelectedMenu] = useState('');

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [animatedResponderMarkers, setAnimatedResponderMarkers] = useState({});

  const [reportRecipient, setReportRecipient] = useState(null);

  const [activeUsers, setActiveUsers] = useState([]);

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
      socketRef.current.on('responder_location_update', handleResponderUpdate);

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
        socketRef.current.off('responder_location_update');
        
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

  useEffect(() => {
    // Automate login activity on mount
    if (user && user.id) {
      markLoginActivity(user.id);
    }
    return () => {
      if (user && user.id) {
        markLogoutActivity(user.id);
      }
    };
  }, [user]);

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

  useEffect(() => {
    // If location is not set after 2 seconds, use default (for dev/testing)
    const timeout = setTimeout(() => {
      if (!location) {
        setLocation(DEFAULT_LOCATION);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [location]);

  // Debug output for location and map rendering
  useEffect(() => {
    console.log('Current location state:', location);
  }, [location]);

  const handleResponderUpdate = (data) => {
    if (!data || !data.id || !data.location) return;
    setAnimatedResponderMarkers(prev => {
      const prevMarker = prev[data.id];
      if (prevMarker && prevMarker.coordinate) {
        prevMarker.coordinate.timing({
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          duration: 1000,
          useNativeDriver: false,
        }).start();
        return { ...prev };
      } else {
        return {
          ...prev,
          [data.id]: {
            ...data,
            coordinate: new AnimatedRegion({
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              latitudeDelta: 0.0005,
              longitudeDelta: 0.0005,
            })
          }
        };
      }
    });
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

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredServices([]);
      return;
    }
    const lower = query.toLowerCase();
    setFilteredServices(
      nearbyServices.filter(service =>
        service.name?.toLowerCase().includes(lower) ||
        service.type?.toLowerCase().includes(lower) ||
        (service.category && service.category.toLowerCase().includes(lower))
      )
    );
  };

  const renderHeader = () => (
    <View style={{
      position: 'absolute',
      top: 20,
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255,255,255,0.97)',
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 5,
      zIndex: 10
    }}>
      <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={{ marginRight: 10 }}>
        <MaterialCommunityIcons name="menu" size={28} color="#204080" />
      </TouchableOpacity>
      <View style={{ flex: 1, marginRight: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 8 }}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput
            style={{ flex: 1, fontSize: 15, paddingVertical: 4, marginLeft: 4, color: '#222' }}
            placeholder="Search hospitals, police, fire..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
        <MaterialCommunityIcons name="account-circle" size={32} color="#007AFF" />
      </TouchableOpacity>
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
    switch (type) {
      case 'chat':
        // Open chat screen with the relevant service
        navigation.navigate('ChatScreen', { type: emergencyMenu });
        break;
      case 'share':
        // Share current location with the selected service
        Alert.alert('Location Shared', `Your location has been shared with the ${emergencyMenu}.`);
        // Optionally, emit socket or API call here
        break;
      case 'call':
        // Call the nearest service (police, ambulance, fire, parents)
        let phoneNumber = '';
        switch (emergencyMenu) {
          case 'police': phoneNumber = '100'; break;
          case 'ambulance': phoneNumber = '102'; break;
          case 'fire': phoneNumber = '101'; break;
          case 'parents': phoneNumber = '1234567890'; break; // Replace with real parent number
          default: phoneNumber = '';
        }
        if (phoneNumber) {
          Linking.openURL(`tel:${phoneNumber}`);
        } else {
          Alert.alert('Error', 'No phone number available.');
        }
        break;
      case 'thanks':
        Alert.alert('Thank You', `Thank you message sent to the ${emergencyMenu}.`);
        // Optionally, send a thank you message via socket or API
        break;
      case 'alert':
        Alert.alert('Alert Sent', 'Alert has been sent to your parents.');
        // Optionally, emit alert event here
        break;
      case 'zone':
        Alert.alert('Safe Zone', 'Safe zone has been set for your parents.');
        // Optionally, implement safe zone logic
        break;
      default:
        setEmergencyMenu(null);
        break;
    }
    setEmergencyMenu(null);
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

  const sendEmergencyRequest = async (featureKey, ...args) => {
    const contacts = featureToContacts[featureKey] || [];
    // For each contact, send the request (API, socket, etc.)
    for (const contact of contacts) {
      // Example: send to each contact (implement actual logic as needed)
      // await sendRequestToContact(contact, ...args);
      // For demo, just log:
      console.log(`Sending emergency request for ${featureKey} to ${contact}`);
    }
    // Existing logic...
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

  const handleMenuSelect = menu => {
    setSelectedMenu(menu);
    setIsMenuOpen(false);
  };

  const renderReportPanel = () => {
    // Define possible recipients (can be dynamic if needed)
    const recipients = [
      { key: 'police', label: 'Police', icon: 'police-badge', color: '#204080' },
      { key: 'fire', label: 'Fire Brigade', icon: 'fire-truck', color: '#ef4444' },
      { key: 'ambulance', label: 'Ambulance', icon: 'ambulance', color: '#ea580c' },
      { key: 'parents', label: 'Parents', icon: 'account-group', color: '#0ea5e9' },
      { key: 'trustedContacts', label: 'Trusted Contacts', icon: 'account-multiple', color: '#6366f1' },
    ];
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Report Incident</Text>
        <Text style={{ fontSize: 15, color: '#555', marginBottom: 14 }}>Who do you want to send this report to?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
          {recipients.map(r => (
            <TouchableOpacity
              key={r.key}
              style={{
                backgroundColor: reportRecipient === r.key ? r.color : '#f3f4f6',
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
                margin: 5,
                minWidth: 90,
                shadowColor: r.color,
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 2,
              }}
              onPress={() => setReportRecipient(r.key)}
            >
              <MaterialCommunityIcons name={r.icon} size={28} color={reportRecipient === r.key ? '#fff' : r.color} />
              <Text style={{ color: reportRecipient === r.key ? '#fff' : '#222', marginTop: 5, fontWeight: '600' }}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Show incident form only if a recipient is selected */}
        {reportRecipient && (
          <IncidentReportForm
            recipient={reportRecipient}
            onSubmit={() => setReportRecipient(null)}
            onCancel={() => setReportRecipient(null)}
          />
        )}
      </View>
    );
  };

  useEffect(() => {
    const getActiveUsers = async () => {
      try {
        const users = await fetchActiveUsers();
        setActiveUsers(users);
      } catch (err) {
        setActiveUsers([]);
      }
    };
    getActiveUsers();
    const interval = setInterval(getActiveUsers, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6fb' }}>
      {/* Map full screen as background */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        region={location || DEFAULT_LOCATION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        loadingEnabled={true}
        showsBuildings={true}
        showsTraffic={true}
        showsIndoors={true}
        showsPointsOfInterest={true}
        showsIndoorLevelPicker={true}
      >
        {/* Custom user location marker */}
        {location && (
          <Marker coordinate={location} anchor={{ x: 0.5, y: 0.5 }}>
            <MaterialCommunityIcons name="crosshairs-gps" size={36} color="#2563eb" />
          </Marker>
        )}
        {/* Animated responder markers */}
        {Object.values(animatedResponderMarkers).map((responder, idx) => (
          responder.coordinate ? (
            <Marker.Animated
              key={responder.id || idx}
              coordinate={responder.coordinate}
              title={responder.name || responder.role}
              description={responder.contact ? `Contact: ${responder.contact}` : responder.role}
            >
              <MaterialCommunityIcons
                name={
                  responder.role === 'police' ? 'police-badge' :
                  responder.role === 'ambulance' ? 'ambulance' :
                  responder.role === 'fire' ? 'fire-truck' :
                  'account-badge'
                }
                size={32}
                color={
                  responder.role === 'police' ? '#204080' :
                  responder.role === 'ambulance' ? '#ea580c' :
                  responder.role === 'fire' ? '#ef4444' :
                  '#6366f1'
                }
              />
            </Marker.Animated>
          ) : null
        ))}
        {activeUsers.map(user => (
          user.latitude && user.longitude ? (
            <Marker
              key={user.id}
              coordinate={{ latitude: user.latitude, longitude: user.longitude }}
              title={user.name}
              description={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              pinColor={
                user.role === 'police' ? '#204080' :
                user.role === 'ambulance' ? '#ea580c' :
                user.role === 'fire' ? '#ef4444' :
                user.role === 'parent' ? '#0ea5e9' : '#888'
              }
            >
              <MaterialCommunityIcons name={
                user.role === 'police' ? 'police-badge' :
                user.role === 'ambulance' ? 'ambulance' :
                user.role === 'fire' ? 'fire-truck' :
                user.role === 'parent' ? 'account-group' : 'account'
              } size={28} color={
                user.role === 'police' ? '#204080' :
                user.role === 'ambulance' ? '#ea580c' :
                user.role === 'fire' ? '#ef4444' :
                user.role === 'parent' ? '#0ea5e9' : '#888'
              } />
            </Marker>
          ) : null
        ))}
        {(searchQuery ? filteredServices : nearbyServices).map((service, index) => (
          service.location && typeof service.location.lat === 'number' && typeof service.location.lng === 'number' ? (
            <Marker
              key={index}
              coordinate={{
                latitude: service.location.lat,
                longitude: service.location.lng
              }}
              title={service.name}
              description={service.description}
            >
              <MaterialCommunityIcons name="storefront" size={32} color="#4CAF50" />
            </Marker>
          ) : null
        ))}
      </MapView>
      {/* Custom My Location Button */}
      <TouchableOpacity
        onPress={() => {
          if (location && mapRef.current) {
            mapRef.current.animateToRegion(location, 600);
          }
        }}
        style={{
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 40 : 28,
          right: 18,
          backgroundColor: '#fff',
          borderRadius: 26,
          padding: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 6,
          elevation: 6,
          zIndex: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name="crosshairs-gps" size={28} color="#2563eb" />
      </TouchableOpacity>
      {/* Floating top bar (profile, menu, greeting) */}
      {renderHeader()}
      {/* Modern modal for feature panels */}
      <Modal
        visible={!!selectedMenu}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedMenu('')}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(30,41,59,0.22)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            width: '92%',
            backgroundColor: '#fff',
            borderRadius: 28,
            paddingVertical: 32,
            paddingHorizontal: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 18,
            elevation: 15,
            alignItems: 'stretch',
            position: 'relative',
          }}>
            <TouchableOpacity
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: '#f3f4f6', borderRadius: 20, padding: 8, elevation: 2 }}
              onPress={() => setSelectedMenu('')}
            >
              <MaterialCommunityIcons name="close" size={28} color="#64748b" />
            </TouchableOpacity>
            {/* Modal Header with Icon and Title */}
            <View style={{ alignItems: 'center', marginBottom: 18, flexDirection: 'row', justifyContent: 'center' }}>
              {selectedMenu === 'reportIncident' && <MaterialCommunityIcons name="alert-circle" size={32} color="#ef4444" style={{ marginRight: 12 }} />}
              {selectedMenu === 'trustedContacts' && <MaterialCommunityIcons name="account-group" size={32} color="#0ea5e9" style={{ marginRight: 12 }} />}
              {selectedMenu === 'healthMonitor' && <MaterialCommunityIcons name="heart-pulse" size={32} color="#f59e42" style={{ marginRight: 12 }} />}
              {selectedMenu === 'emergencyAlert' && <MaterialCommunityIcons name="bell-alert" size={32} color="#f59e42" style={{ marginRight: 12 }} />}
              {selectedMenu === 'nearbyIncidents' && <MaterialCommunityIcons name="map-marker" size={32} color="#6366f1" style={{ marginRight: 12 }} />}
              {selectedMenu === 'safeRoute' && <MaterialCommunityIcons name="navigation" size={32} color="#10b981" style={{ marginRight: 12 }} />}
              {selectedMenu === 'resourceAvailability' && <MaterialCommunityIcons name="database" size={32} color="#6366f1" style={{ marginRight: 12 }} />}
              {selectedMenu === 'agencyCollaboration' && <MaterialCommunityIcons name="handshake" size={32} color="#f59e42" style={{ marginRight: 12 }} />}
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1e293b', letterSpacing: 0.3 }}>
                {selectedMenu === 'reportIncident' && 'Report Incident'}
                {selectedMenu === 'trustedContacts' && 'Trusted Contacts'}
                {selectedMenu === 'healthMonitor' && 'Health Monitor'}
                {selectedMenu === 'emergencyAlert' && 'Emergency Alert'}
                {selectedMenu === 'nearbyIncidents' && 'Nearby Incidents'}
                {selectedMenu === 'safeRoute' && 'Safe Route'}
                {selectedMenu === 'resourceAvailability' && 'Resource Availability'}
                {selectedMenu === 'agencyCollaboration' && 'Agency Collaboration'}
                {selectedMenu === 'checkIn' && 'Check-In'}
                {selectedMenu === 'emergencyCall' && 'Emergency Call'}
              </Text>
            </View>
            <View style={{ marginTop: 12, marginBottom: 6 }}>
              {/* Style all direct child buttons/Touchables with spacing and curved design */}
              {selectedMenu === 'reportIncident' && (
                renderReportPanel()
              )}
              {selectedMenu === 'trustedContacts' && (
                <View style={{ gap: 16 }}>
                  <TrustedContacts userId={user?.id} buttonStyle={{ borderRadius: 16, marginBottom: 12, paddingVertical: 14, backgroundColor: '#e0e7ff' }} />
                </View>
              )}
              {selectedMenu === 'healthMonitor' && (
                <View style={{ gap: 16 }}>
                  <HealthMonitor userId={user?.id} buttonStyle={{ borderRadius: 16, marginBottom: 12, paddingVertical: 14, backgroundColor: '#e0e7ff' }} />
                </View>
              )}
              {selectedMenu === 'emergencyAlert' && (
                <View style={{ gap: 16 }}>
                  <EmergencyAlertButton userId={user?.id} buttonStyle={{ borderRadius: 16, marginBottom: 12, paddingVertical: 14, backgroundColor: '#e0e7ff' }} />
                </View>
              )}
              {selectedMenu === 'nearbyIncidents' && (
                <View style={{ gap: 16 }}>
                  <IncidentMap userId={user?.id} buttonStyle={{ borderRadius: 16, marginBottom: 12, paddingVertical: 14, backgroundColor: '#e0e7ff' }} />
                </View>
              )}
              {selectedMenu === 'safeRoute' && (
                <View style={{ gap: 16 }}>
                  <SafeRouteSuggester userId={user?.id} buttonStyle={{ borderRadius: 16, marginBottom: 12, paddingVertical: 14, backgroundColor: '#e0e7ff' }} />
                </View>
              )}
              {selectedMenu === 'resourceAvailability' && (
                <View style={{ gap: 16 }}>
                  <ResourceAvailabilityPanel userId={user?.id} buttonStyle={{ borderRadius: 16, marginBottom: 12, paddingVertical: 14, backgroundColor: '#e0e7ff' }} />
                </View>
              )}
              {selectedMenu === 'agencyCollaboration' && (
                <View style={{ gap: 16 }}>
                  <AgencyCollaborationPanel userId={user?.id} buttonStyle={{ borderRadius: 16, marginBottom: 12, paddingVertical: 14, backgroundColor: '#e0e7ff' }} />
                </View>
              )}
              {selectedMenu === 'checkIn' && (
                <View style={{ gap: 16 }}>
                  <CheckInPanel userId={user?.id} buttonStyle={{ borderRadius: 16, marginBottom: 12, paddingVertical: 14, backgroundColor: '#e0e7ff' }} />
                </View>
              )}
              {selectedMenu === 'emergencyCall' && (
                <View style={{ gap: 16 }}>
                  <EmergencyCallPanel userId={user?.id} buttonStyle={{ borderRadius: 16, marginBottom: 12, paddingVertical: 14, backgroundColor: '#e0e7ff' }} />
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
      {/* Feature Grid Modal (Hamburger Menu) */}
      <Modal
        visible={isMenuOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(30,41,59,0.15)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            width: '92%',
            backgroundColor: '#fff',
            borderRadius: 28,
            paddingVertical: 28,
            paddingHorizontal: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 18,
            elevation: 15,
            alignItems: 'center',
            position: 'relative',
          }}>
            <TouchableOpacity
              style={{ position: 'absolute', top: 18, right: 18, zIndex: 10, backgroundColor: '#f3f4f6', borderRadius: 20, padding: 8, elevation: 2 }}
              onPress={() => setIsMenuOpen(false)}
            >
              <MaterialCommunityIcons name="close" size={28} color="#64748b" />
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 }}>Menu</Text>
            <View style={{
              flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 18,
              backgroundColor: 'rgba(255,255,255,0.93)', borderRadius: 18, padding: 10, marginBottom: 10
            }}>
              {[
                { key: 'reportIncident', icon: 'alert-circle', color: '#ef4444', label: 'Report' },
                { key: 'trustedContacts', icon: 'account-group', color: '#0ea5e9', label: 'Contacts' },
                { key: 'healthMonitor', icon: 'heart-pulse', color: '#f59e42', label: 'Health' },
                { key: 'emergencyAlert', icon: 'bell-alert', color: '#f59e42', label: 'Alert' },
                { key: 'nearbyIncidents', icon: 'map-marker', color: '#6366f1', label: 'Incidents' },
                { key: 'safeRoute', icon: 'navigation', color: '#10b981', label: 'Safe Route' },
                { key: 'resourceAvailability', icon: 'database', color: '#6366f1', label: 'Resources' },
                { key: 'agencyCollaboration', icon: 'handshake', color: '#f59e42', label: 'Collab' },
                { key: 'checkIn', icon: 'check-circle', color: '#22c55e', label: 'Check-In' },
                { key: 'emergencyCall', icon: 'phone-alert', color: '#f43f5e', label: 'Call' },
                { key: 'logout', icon: 'logout', color: '#ef4444', label: 'Logout' },
              ].map(feature => (
                <TouchableOpacity
                  key={feature.key}
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: 18,
                    backgroundColor: '#f3f4f6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 6,
                    shadowColor: feature.color,
                    shadowOpacity: 0.14,
                    shadowRadius: 7,
                    elevation: 4,
                  }}
                  onPress={() => {
                    setIsMenuOpen(false);
                    if (feature.key === 'logout') handleLogout();
                    else if (feature.key === 'checkIn') setSelectedMenu('checkIn');
                    else if (feature.key === 'emergencyCall') setSelectedMenu('emergencyCall');
                    else setSelectedMenu(feature.key);
                  }}
                >
                  <MaterialCommunityIcons name={feature.icon} size={32} color={feature.color} />
                  <Text style={{ fontSize: 13, color: '#222', marginTop: 6, fontWeight: '600' }}>{feature.label}</Text>
                  {feature.key !== 'logout' && (
                    <Text style={{ fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 2 }}>
                      {getContactLabels(feature.key)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ marginVertical: 12 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>Active Responders:</Text>
        {activeUsers.length === 0 ? (
          <Text style={{ color: '#888' }}>No responders online.</Text>
        ) : (
          activeUsers.map(user => (
            <View key={user.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <MaterialCommunityIcons name={
                user.role === 'police' ? 'police-badge' :
                user.role === 'ambulance' ? 'ambulance' :
                user.role === 'fire' ? 'fire-truck' :
                user.role === 'parent' ? 'account-group' : 'account'
              } size={20} color={
                user.role === 'police' ? '#204080' :
                user.role === 'ambulance' ? '#ea580c' :
                user.role === 'fire' ? '#ef4444' :
                user.role === 'parent' ? '#0ea5e9' : '#888'
              } style={{ marginRight: 8 }} />
              <Text style={{ fontWeight: '600' }}>{user.name}</Text>
              <Text style={{ marginLeft: 8, color: '#666' }}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modernContainer: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  modernHeader: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#204080',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCentered: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  panel: {
    position: 'absolute',
    top: 60,
    left: 30,
    right: 30,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    padding: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  dashboardPanel: {
    // Style for dashboard summary if needed
    position: 'absolute',
    top: 60,
    left: 30,
    right: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  dashboardSummary: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default UserDashboard;
