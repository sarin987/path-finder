import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  FlatList
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useAuth } from '../../contexts/AuthContext';
import { GiftedChat, Bubble, Send } from 'react-native-gifted-chat';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Mock data for responders
const MOCK_RESPONDERS = [
  {
    id: '1',
    name: 'Police Unit 101',
    type: 'police',
    location: {
      latitude: 10.8515,
      longitude: 76.2711,
    },
    status: 'available',
    eta: '2 min',
  },
  {
    id: '2',
    name: 'Ambulance A23',
    type: 'ambulance',
    location: {
      latitude: 10.8495,
      longitude: 76.2700,
    },
    status: 'available',
    eta: '3 min',
  },
  {
    id: '3',
    name: 'Fire Truck F45',
    type: 'fire',
    location: {
      latitude: 10.8500,
      longitude: 76.2720,
    },
    status: 'on_call',
    eta: '5 min',
  },
];

// Mock incident history
const MOCK_INCIDENTS = [
  {
    id: '1',
    type: 'medical',
    status: 'resolved',
    date: '2023-06-10',
    responder: 'Ambulance A23',
    location: '123 Main St, City',
  },
  {
    id: '2',
    type: 'safety',
    status: 'in_progress',
    date: '2023-06-08',
    responder: 'Police Unit 101',
    location: '456 Park Ave, City',
  },
];

const UserDashboard = ({ navigation }) => {
  // Refs
  const mapRef = useRef(null);
  const isMounted = useRef(true);
  
  // Auth context
  const { user, logout } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({
    latitude: 10.8505,
    longitude: 76.2711,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [sosActive, setSosActive] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [locationError, setLocationError] = useState(null);
  const [responders, setResponders] = useState(MOCK_RESPONDERS);
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [selectedResponder, setSelectedResponder] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [responderFilter, setResponderFilter] = useState('all');
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: '1', name: 'Mom', phone: '+1234567890', isPrimary: true },
    { id: '2', name: 'Dad', phone: '+1987654321', isPrimary: false },
  ]);
  const [showContactsModal, setShowContactsModal] = useState(false);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setLocation(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        setLoading(false);
      },
      error => {
        console.log('Error getting location:', error);
        setLocationError('Unable to get your current location');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  // Request location permission
  const requestLocationPermission = useCallback(async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await request(permission);
      
      if (result === RESULTS.GRANTED) {
        getCurrentLocation();
      } else {
        setLocationError('Location permission denied');
        setLoading(false);
      }
    } catch (err) {
      console.log('Permission request error:', err);
      setLocationError('Error requesting location permission');
      setLoading(false);
    }
  }, [getCurrentLocation]);

  // Toggle SOS
  const toggleSOS = () => {
    if (sosActive) {
      setSosActive(false);
      setShowChat(false);
      setSelectedResponder(null);
      Alert.alert('SOS Deactivated', 'Emergency services have been notified of your cancellation.');
    } else {
      setSosActive(true);
      Alert.alert(
        'SOS Activated', 
        'Emergency services have been notified. Help is on the way!',
        [
          {
            text: 'Chat with Responder',
            onPress: () => setShowChat(true),
          },
          { text: 'OK' },
        ]
      );
    }
  };

  // Handle sending a message
  const onSend = useCallback((messages = []) => {
    setMessages(previousMessages => GiftedChat.append(previousMessages, messages));
  }, []);

  // Handle responder selection
  const handleResponderSelect = (responder) => {
    setSelectedResponder(responder);
    setShowChat(true);
    
    // Add system message
    const systemMessage = {
      _id: Math.round(Math.random() * 1000000),
      text: `Connected to ${responder.name}. Please describe your emergency.`,
      createdAt: new Date(),
      system: true,
    };
    
    setMessages(previousMessages => GiftedChat.append(previousMessages, [systemMessage]));
  };

  // Render chat bubble
  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#FF3B30',
          },
          left: {
            backgroundColor: '#f0f0f0',
          },
        }}
        textStyle={{
          right: {
            color: '#fff',
          },
        }}
      />
    );
  };

  // Render responder marker
  const renderResponderMarker = (responder) => {
    let iconName = 'account';
    let color = '#4CAF50'; // Default green
    
    switch(responder.type) {
      case 'police':
        iconName = 'police-badge';
        color = '#3F51B5'; // Blue
        break;
      case 'ambulance':
        iconName = 'ambulance';
        color = '#F44336'; // Red
        break;
      case 'fire':
        iconName = 'fire-truck';
        color = '#FF9800'; // Orange
        break;
    }
    
    return (
      <Marker
        key={responder.id}
        coordinate={responder.location}
        onPress={() => handleResponderSelect(responder)}
      >
        <View style={[styles.responderMarker, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={iconName} size={20} color="#fff" />
        </View>
      </Marker>
    );
  };

  // Filter responders by type
  const filteredResponders = responderFilter === 'all' 
    ? responders 
    : responders.filter(r => r.type === responderFilter);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  // Initialize location tracking
  useEffect(() => {
    requestLocationPermission();
    
    return () => {
      isMounted.current = false;
    };
  }, [requestLocationPermission]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={{ marginTop: 10 }}>Loading your location...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, {user?.name?.split(' ')[0] || 'User'}</Text>
          <Text style={styles.locationText}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#FF3B30" /> 
            {sosActive ? 'EMERGENCY ACTIVE' : 'You are safe'}
            {sosActive && (
              <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}> • {selectedResponder?.name || 'Searching...'}</Text>
            )}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.headerButton, styles.contactsButton]}
            onPress={() => setShowContactsModal(true)}
          >
            <MaterialCommunityIcons name="account-group" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Map View */}
        {activeTab === 'map' && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={location}
              showsUserLocation={true}
              showsMyLocationButton={false}
              followsUserLocation={true}
              showsCompass={true}
            >
              {/* User Location Marker */}
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
              >
                <View style={styles.userMarker}>
                  <View style={[styles.pulse, sosActive && styles.pulseActive]} />
                  <View style={styles.userMarkerInner}>
                    <MaterialCommunityIcons name="account" size={20} color="#fff" />
                  </View>
                </View>
              </Marker>

              {/* Responder Markers */}
              {filteredResponders.map(responder => renderResponderMarker(responder))}

              {/* SOS Radius */}
              {sosActive && (
                <Circle
                  center={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  radius={500} // 500 meters
                  fillColor="rgba(239, 68, 68, 0.2)"
                  strokeColor="rgba(239, 68, 68, 0.7)"
                  strokeWidth={2}
                />
              )}
            </MapView>

            {/* Responder Type Filter */}
            <View style={styles.responderFilter}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  responderFilter === 'all' && styles.filterButtonActive
                ]}
                onPress={() => setResponderFilter('all')}
              >
                <MaterialCommunityIcons name="account-group" size={20} color={responderFilter === 'all' ? '#fff' : '#333'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  responderFilter === 'police' && styles.filterButtonActive
                ]}
                onPress={() => setResponderFilter('police')}
              >
                <MaterialCommunityIcons name="police-badge" size={20} color={responderFilter === 'police' ? '#fff' : '#333'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  responderFilter === 'ambulance' && styles.filterButtonActive
                ]}
                onPress={() => setResponderFilter('ambulance')}
              >
                <MaterialCommunityIcons name="ambulance" size={20} color={responderFilter === 'ambulance' ? '#fff' : '#333'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  responderFilter === 'fire' && styles.filterButtonActive
                ]}
                onPress={() => setResponderFilter('fire')}
              >
                <MaterialCommunityIcons name="fire-truck" size={20} color={responderFilter === 'fire' ? '#fff' : '#333'} />
              </TouchableOpacity>
            </View>

            {/* Map Controls */}
            <View style={styles.mapControls}>
              <TouchableOpacity 
                style={styles.mapControlButton}
                onPress={getCurrentLocation}
              >
                <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#333" />
              </TouchableOpacity>
              {sosActive && (
                <TouchableOpacity 
                  style={[styles.mapControlButton, styles.sosChatButton]}
                  onPress={() => setShowChat(true)}
                >
                  <MaterialCommunityIcons name="chat" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Incidents Tab */}
        {activeTab === 'incidents' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Incident History</Text>
            {incidents.length > 0 ? (
              <FlatList
                data={incidents}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={styles.incidentCard}>
                    <View style={styles.incidentHeader}>
                      <View style={styles.incidentTypeBadge}>
                        <MaterialCommunityIcons 
                          name={item.type === 'medical' ? 'medical-bag' : 'shield-alert'} 
                          size={16} 
                          color="#fff" 
                        />
                        <Text style={styles.incidentTypeText}>
                          {item.type === 'medical' ? 'Medical' : 'Safety'}
                        </Text>
                      </View>
                      <Text style={styles.incidentDate}>{item.date}</Text>
                    </View>
                    <Text style={styles.incidentResponder}>Responder: {item.responder}</Text>
                    <Text style={styles.incidentLocation}>{item.location}</Text>
                    <View style={[
                      styles.incidentStatus,
                      item.status === 'resolved' ? styles.statusResolved : styles.statusInProgress
                    ]}>
                      <Text style={styles.incidentStatusText}>
                        {item.status === 'resolved' ? 'Resolved' : 'In Progress'}
                      </Text>
                    </View>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="shield-check" size={48} color="#e0e0e0" />
                <Text style={styles.emptyStateText}>No incidents reported</Text>
                <Text style={styles.emptyStateSubtext}>Your safety history will appear here</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* SOS Button */}
      <TouchableOpacity 
        style={[styles.sosButton, sosActive && styles.sosButtonActive]}
        onPress={toggleSOS}
        activeOpacity={0.8}
      >
        <Text style={styles.sosButtonText}>
          {sosActive ? 'CANCEL SOS' : 'SOS'}
        </Text>
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={showChat}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowChat(false)}
      >
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity 
              style={styles.chatBackButton}
              onPress={() => setShowChat(false)}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.chatTitle}>
              {selectedResponder ? `Chat with ${selectedResponder.name}` : 'Emergency Chat'}
            </Text>
          </View>
          <GiftedChat
            messages={messages}
            onSend={messages => onSend(messages)}
            user={{
              _id: user?.id || 'user',
              name: user?.name || 'User',
            }}
            renderBubble={renderBubble}
            alwaysShowSend
            renderSend={(props) => (
              <Send {...props} containerStyle={styles.sendButtonContainer}>
                <MaterialCommunityIcons name="send-circle" size={32} color="#FF3B30" />
              </Send>
            )}
          />
        </View>
      </Modal>

      {/* Emergency Contacts Modal */}
      <Modal
        visible={showContactsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowContactsModal(false)}
      >
        <View style={styles.contactsContainer}>
          <View style={styles.contactsHeader}>
            <TouchableOpacity 
              style={styles.contactsBackButton}
              onPress={() => setShowContactsModal(false)}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.contactsTitle}>Emergency Contacts</Text>
          </View>
          <FlatList
            data={emergencyContacts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.contactItem}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactInitial}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  <Text style={styles.contactPhone}>{item.phone}</Text>
                </View>
                {item.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Primary</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.contactAction}>
                  <MaterialCommunityIcons name="message-text" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            )}
            ListFooterComponent={
              <TouchableOpacity style={styles.addContactButton}>
                <MaterialCommunityIcons name="plus-circle" size={20} color="#3B82F6" />
                <Text style={styles.addContactText}>Add Emergency Contact</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navButton, activeTab === 'map' && styles.navButtonActive]}
          onPress={() => setActiveTab('map')}
        >
          <MaterialCommunityIcons 
            name="map" 
            size={24} 
            color={activeTab === 'map' ? '#FF3B30' : '#666'} 
          />
          <Text style={[styles.navButtonText, activeTab === 'map' && styles.navButtonTextActive]}>
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, activeTab === 'incidents' && styles.navButtonActive]}
          onPress={() => setActiveTab('incidents')}
        >
          <MaterialCommunityIcons 
            name="clipboard-list" 
            size={24} 
            color={activeTab === 'incidents' ? '#FF3B30' : '#666'} 
          />
          <Text style={[styles.navButtonText, activeTab === 'incidents' && styles.navButtonTextActive]}>
            Incidents
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Header Actions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 10,
    padding: 5,
  },
  contactsButton: {
    marginRight: 5,
  },
  
  // Loading Container
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    padding: 8,
  },
  
  // Content
  content: {
    flex: 1,
    position: 'relative',
  },
  
  // Map
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sosChatButton: {
    backgroundColor: '#FF3B30',
  },
  responderFilter: {
    position: 'absolute',
    top: 20,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 5,
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  filterButtonActive: {
    backgroundColor: '#FF3B30',
  },
  responderMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mapControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  // User Marker
  userMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userMarkerInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    top: -14,
    left: -14,
    opacity: 0,
  },
  pulseActive: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  
  // Tab Content
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  
  // Incident Card
  incidentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentTypeBadge: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  incidentTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  incidentDate: {
    color: '#666',
    fontSize: 12,
  },
  incidentResponder: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  incidentLocation: {
    color: '#666',
    fontSize: 13,
    marginBottom: 8,
  },
  incidentStatus: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  statusResolved: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusInProgress: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  incidentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // SOS Button
  sosButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#FF3B30',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  sosButtonActive: {
    backgroundColor: '#dc2626',
    transform: [{ scale: 1.1 }],
  },
  sosButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Chat Modal
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chatBackButton: {
    marginRight: 15,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sendButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  
  // Contacts Modal
  contactsContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactsBackButton: {
    marginRight: 15,
  },
  contactsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactPhone: {
    color: '#666',
    fontSize: 14,
  },
  primaryBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 10,
  },
  primaryBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  contactAction: {
    padding: 8,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  addContactText: {
    color: '#3B82F6',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navButton: {
    alignItems: 'center',
    padding: 8,
    flex: 1,
  },
  navButtonActive: {
    // Active state styles
  },
  navButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  navButtonTextActive: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
});

export default UserDashboard;