import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import MapView, { Marker, Circle } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import io from 'socket.io-client';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

// Initialize socket connection
const socket = io('YOUR_BACKEND_URL');

const UserDashboard = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const mapRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [nearbyServices, setNearbyServices] = useState({
    police: [],
    hospitals: [],
    ambulances: [],
  });
  const [selectedService, setSelectedService] = useState(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, name: 'City Police Control', phone: '100', type: 'police' },
    { id: 2, name: 'Emergency Ambulance', phone: '102', type: 'ambulance' },
    { id: 3, name: 'Fire Department', phone: '101', type: 'fire' },
  ]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
    getLocation();
    setupSocketListeners();

    return () => {
      socket.disconnect();
    };
  }, []);

  const setupSocketListeners = () => {
    socket.on('message', (newMessage) => {
      setChat((prevChat) => [...prevChat, newMessage]);
    });

    socket.on('location_update', (data) => {
      updateNearbyService(data);
    });
  };

  const updateNearbyService = (data) => {
    setNearbyServices(prev => ({
      ...prev,
      [data.type]: prev[data.type].map(service =>
        service.id === data.id ? { ...service, location: data.location } : service
      )
    }));
  };

  const getLocation = async () => {
    try {
      Geolocation.requestAuthorization();
      
      Geolocation.getCurrentPosition(
        position => {
          setLocation(position.coords);
          // Fetch nearby services
          fetchNearbyServices(position.coords);
        },
        error => {
          Alert.alert('Error', 'Failed to get location');
          console.error(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
      console.error(error);
    }
  };

  const fetchNearbyServices = async (coords) => {
    try {
      const response = await fetch(`YOUR_API_ENDPOINT/nearby-services?lat=${coords.latitude}&lng=${coords.longitude}`);
      const data = await response.json();
      setNearbyServices(data);
    } catch (error) {
      console.error('Error fetching nearby services:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      // TODO: Fetch emergency contacts and recent alerts from API
      setEmergencyContacts([
        { id: 1, name: 'Police Control Room', phone: '100' },
        { id: 2, name: 'Ambulance Service', phone: '102' },
        { id: 3, name: 'Fire Service', phone: '101' },
      ]);

      setRecentAlerts([
        { id: 1, type: 'medical', status: 'resolved', date: '2025-03-26' },
        { id: 2, type: 'police', status: 'pending', date: '2025-03-25' },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadDashboardData().finally(() => setRefreshing(false));
  }, []);

  const handleEmergency = (type) => {
    navigation.navigate('EmergencyRequest', { type });
  };

  const renderEmergencyButton = (type, icon, color) => (
    <TouchableOpacity
      style={[styles.emergencyButton, { backgroundColor: color }]}
      onPress={() => handleEmergency(type)}
    >
      <Icon name={icon} size={32} color="white" />
      <Text style={styles.emergencyButtonText}>{type.toUpperCase()}</Text>
    </TouchableOpacity>
  );

  const handleVideoCall = async (contact) => {
    // Implement WebRTC video call logic
    navigation.navigate('VideoCall', { contact });
  };

  const handleImageSend = async () => {
    const result = await launchImageLibrary({
      mediaType: 'mixed',
      quality: 1,
    });

    if (!result.didCancel && result.assets?.[0]) {
      // Upload image/video and send in chat
      socket.emit('media_message', {
        type: result.assets[0].type,
        uri: result.assets[0].uri,
        to: selectedContact.id,
      });
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('message', {
        text: message,
        to: selectedContact.id,
        from: user.id,
      });
      setMessage('');
    }
  };

  const renderMap = () => (
    <View style={styles.mapContainer}>
      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="You are here"
          />
          
          {/* Render nearby services */}
          {selectedService && nearbyServices[selectedService]?.map((service) => (
            <Marker
              key={service.id}
              coordinate={service.location}
              title={service.name}
              description={`${service.type} - ${service.distance}km away`}
              pinColor={service.type === 'police' ? 'blue' : 'red'}
            />
          ))}
        </MapView>
      )}

      {/* Service Selection Buttons */}
      <View style={styles.serviceButtons}>
        <TouchableOpacity
          style={[styles.serviceButton, selectedService === 'police' && styles.selectedButton]}
          onPress={() => setSelectedService('police')}
        >
          <Icon name="police-badge" size={24} color="white" />
          <Text style={styles.serviceButtonText}>Police</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.serviceButton, selectedService === 'hospitals' && styles.selectedButton]}
          onPress={() => setSelectedService('hospitals')}
        >
          <Icon name="hospital-building" size={24} color="white" />
          <Text style={styles.serviceButtonText}>Hospitals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.serviceButton, selectedService === 'ambulances' && styles.selectedButton]}
          onPress={() => setSelectedService('ambulances')}
        >
          <Icon name="ambulance" size={24} color="white" />
          <Text style={styles.serviceButtonText}>Ambulances</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => (
    <ScrollView
      style={styles.mainContent}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        {user?.profile_photo ? (
          <Image
            source={{ uri: user.profile_photo }}
            style={styles.profilePhoto}
          />
        ) : (
          <View style={[styles.profilePhoto, styles.defaultProfileIcon]}>
            <Text style={styles.defaultProfileText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userPhone}>{user?.phone || 'No phone'}</Text>
        </View>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        {emergencyContacts.map(contact => (
          <TouchableOpacity
            key={contact.id}
            style={styles.contactCard}
            onPress={() => handleContactPress(contact)}
          >
            <View style={styles.contactInfo}>
              <Icon
                name={contact.type === 'police' ? 'police-badge' : contact.type === 'ambulance' ? 'ambulance' : 'fire-truck'}
                size={24}
                color="#4B7BFF"
              />
              <View style={styles.contactText}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={24} color="#4B7BFF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        {recentAlerts.map(alert => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertType}>{alert.type}</Text>
              <Text style={styles.alertTime}>{new Date(alert.timestamp).toLocaleString()}</Text>
            </View>
            <Text style={styles.alertDescription}>{alert.description}</Text>
            <View style={[styles.alertStatus, { backgroundColor: alert.status === 'resolved' ? '#4CAF50' : '#FFC107' }]}>
              <Text style={styles.alertStatusText}>{alert.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderChatModal = () => (
    <Modal
      visible={chatModalVisible}
      animationType="slide"
      onRequestClose={() => setChatModalVisible(false)}
    >
      <SafeAreaView style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setChatModalVisible(false)}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>
            {selectedContact?.name}
          </Text>
          <TouchableOpacity onPress={() => handleVideoCall(selectedContact)}>
            <Icon name="video" size={24} color="#4B7BFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.chatMessages}>
          {chat.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageContainer,
                msg.from === user.id ? styles.sentMessage : styles.receivedMessage,
              ]}
            >
              <Text style={styles.messageText}>{msg.text}</Text>
              <Text style={styles.messageTime}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.chatInputContainer}>
          <TouchableOpacity onPress={handleImageSend}>
            <Icon name="camera" size={24} color="#4B7BFF" />
          </TouchableOpacity>
          <TextInput
            style={styles.chatInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
          />
          <TouchableOpacity onPress={sendMessage}>
            <Icon name="send" size={24} color="#4B7BFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderMap()}
      {renderContent()}
      {renderChatModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  defaultProfileIcon: {
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultProfileText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Facebook's background color
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  mapContainer: {
    height: Dimensions.get('window').height * 0.4,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  serviceButtons: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  serviceButton: {
    backgroundColor: '#4B7BFF',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    flex: 1,
    marginHorizontal: 5,
  },
  selectedButton: {
    backgroundColor: '#2C5AE9',
  },
  serviceButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chatMessages: {
    flex: 1,
    padding: 15,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4B7BFF',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8E8E8',
  },
  messageText: {
    color: 'white',
    fontSize: 16,
  },
  messageTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 5,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  chatInput: {
    flex: 1,
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: '#F5F6FA',
    borderRadius: 20,
    fontSize: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#1877F2',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1E21',
    letterSpacing: 0.2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emergencySection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1E21',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  emergencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emergencyButton: {
    flex: 1,
    margin: 4,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877F2', // Facebook blue
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  emergencyButtonText: {
    color: 'white',
    marginTop: 8,
    fontWeight: 'bold',
  },
  contactsSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderRadius: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 15,
  },
  contactName: {
    fontSize: 16,
    color: '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  alertsSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 15,
    elevation: 2,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  alertInfo: {
    flex: 1,
    marginLeft: 15,
  },
  alertType: {
    fontSize: 16,
    color: '#333',
  },
  alertDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  alertStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Chat styles
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1877F2',
    elevation: 4,
  },
  chatHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  chatMessages: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F0F2F5',
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1877F2',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  receivedMessageText: {
    color: '#1C1E21',
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
  },
  chatInput: {
    flex: 1,
    marginHorizontal: 12,
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    fontSize: 15,
    color: '#1C1E21',
  },
});

export default UserDashboard;
