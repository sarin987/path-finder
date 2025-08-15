import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, StatusBar, ActivityIndicator, Animated, Dimensions, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';

// Define PermissionsAndroid for web compatibility
let PermissionsAndroid = {
  request: () => Promise.resolve('unavailable'),
  PERMISSIONS: {
    ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
  },
};

if (Platform.OS === 'android') {
  try {
    const PermissionsAndroidModule = require('react-native/Libraries/PermissionsAndroid/PermissionsAndroid');
    if (PermissionsAndroidModule) {
      PermissionsAndroid = PermissionsAndroidModule;
    }
  } catch (error) {
    console.warn('PermissionsAndroid not available:', error);
  }
}
import { alert } from '../../utils/alert';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import HeaderBar from '../../components/dashboard/HeaderBar';
import MapCard from '../../components/dashboard/MapCard';
import SOSButton from '../../components/dashboard/SOSButton';
import SOSRoleModal from '../../components/dashboard/SOSRoleModal';
import ResponderBottomSheet from '../../components/dashboard/ResponderBottomSheet';
import FloatingChatButton from '../../components/dashboard/FloatingChatButton';
import StatusBanner from '../../components/dashboard/StatusBanner';
import { socketManager } from '../../utils/socket';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Geolocation from '@react-native-community/geolocation';
import UserAvatar from '../../components/dashboard/UserAvatar';

const { height } = Dimensions.get('window');
const SOS_ROLES = [
  { key: 'police', label: 'Police', icon: 'local-police', color: '#1976D2' },
  { key: 'ambulance', label: 'Ambulance', icon: 'local-hospital', color: '#43A047' },
  { key: 'fire', label: 'Fire', icon: 'local-fire-department', color: '#E53935' },
  { key: 'parent', label: 'Parent', icon: 'supervisor-account', color: '#FBC02D' },
];

const APP_HEADER_COLOR = '#128090';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [userLocation, setUserLocation] = useState(null);
  const [responders, setResponders] = useState([]);
  const [loadingResponders, setLoadingResponders] = useState(false);
  const [responderError, setResponderError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sosRole, setSosRole] = useState('police');
  const [showSosModal, setShowSosModal] = useState(false);
  const [sendingSOS, setSendingSOS] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [activeRoleFilter, setActiveRoleFilter] = useState(null);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;

  const requestLocationPermission = React.useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show your position on the map.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true; // iOS permissions handled in Info.plist
  }, []);

  const getLocation = React.useCallback(async () => {
    setLoading(true);
    setLocationError(null);
    // 1. Request permission first
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setLoading(false);
      setLocationError('Location permission denied. Please enable location permissions in your device settings.');
      return;
    }
    // 2. Add a small delay to ensure UI is ready
    await new Promise(res => setTimeout(res, 500));
    // 3. Check if Geolocation is available
    if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
      setLoading(false);
      setLocationError('Geolocation is not available on this device.');
      return;
    }
    // 4. Try to get location
    Geolocation.getCurrentPosition(
      pos => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLoading(false);
      },
      err => {
        if (err.code === 3) { // TIMEOUT
          Geolocation.getCurrentPosition(
            pos2 => {
              setUserLocation({
                latitude: pos2.coords.latitude,
                longitude: pos2.coords.longitude,
              });
              setLoading(false);
            },
            err2 => {
              if (Geolocation.getLastKnownPosition) {
                Geolocation.getLastKnownPosition(
                  pos3 => {
                    if (pos3) {
                      setUserLocation({
                        latitude: pos3.coords.latitude,
                        longitude: pos3.coords.longitude,
                      });
                      setLoading(false);
                    } else {
                      setLoading(false);
                      setLocationError('Unable to get your location. Please move to an open area or check your device settings.');
                    }
                  },
                  err3 => {
                    setLoading(false);
                    setLocationError('Unable to get your location. Please move to an open area or check your device settings.');
                  }
                );
              } else {
                setLoading(false);
                setLocationError('Unable to get your location. Please move to an open area or check your device settings.');
              }
            },
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
          );
        } else {
          setLoading(false);
          let errorMessage = 'Unable to get your location. Please ensure location is enabled and try again.';
          switch (err.code) {
            case 1:
              errorMessage = 'Location permission denied. Please enable location permissions in your device settings.';
              break;
            case 2:
              errorMessage = 'Location service unavailable. Please check if location services are enabled on your device.';
              break;
            case 3:
              errorMessage = 'Location request timed out. Please try again in an open area.';
              break;
            default:
              errorMessage = err?.message || errorMessage;
          }
          setLocationError(errorMessage);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  }, [requestLocationPermission, setLoading, setLocationError, setUserLocation]);

  useFocusEffect(
    React.useCallback(() => {
      getLocation();
    }, [getLocation])
  );

  // Connect to socket and get responders
  useEffect(() => {
    if (!user || !userLocation) {return;}

    const socket = socketManager.connect(user.token);
    setLoadingResponders(true);
    setResponderError(null);

    // Send user's location to the server
    socket.emit('user_location_update', {
      userId: user.id,
      role: 'user',
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      timestamp: new Date().toISOString(),
    });

    // Handle responder location updates
    const handleResponderUpdate = (responder) => {
      setResponders(prevResponders => {
        // Filter out the existing responder if present
        const filtered = prevResponders.filter(r => r.userId !== responder.userId);
        // Add/update the responder
        return [...filtered, responder];
      });
    };

    socket.on('responder_location_updated', handleResponderUpdate);

    // Request initial responder locations
    socket.emit('get_responders', {
      role: activeRoleFilter,
      lat: userLocation.latitude,
      lng: userLocation.longitude,
    }, (response) => {
      setLoadingResponders(false);
      if (response.error) {
        setResponderError('Failed to load responders. Please try again.');
        console.error('Error getting responders:', response.error);
      } else if (Array.isArray(response)) {
        setResponders(response);
      }
    });

    return () => {
      socket.off('responder_location_updated', handleResponderUpdate);
      socket.disconnect();
    };
  }, [user, userLocation, activeRoleFilter]);

  // SOS send
  const handleSendSOS = async (roleKey) => {
    if (!userLocation || !roleKey) {return;}
    setSendingSOS(true);
    try {
      socketManager.emit('user_sos', {
        userId: user.id,
        role: roleKey,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        timestamp: new Date().toISOString(),
      });
      setStatusMsg(`SOS sent to ${roleKey.charAt(0).toUpperCase() + roleKey.slice(1)}!`);
      setStatusType('success');
      setShowSosModal(false);
    } catch (err) {
      setStatusMsg('Failed to send SOS. Please try again.');
      setStatusType('error');
    } finally {
      setSendingSOS(false);
    }
  };

  // Map recenter
  const handleRecenter = () => getLocation();

  // Chat actions
  const handleChat = (responder) => navigation.navigate('Chat', { responder });
  const handleCall = (responder) => alert('Call', `Calling ${responder.name || responder.role}...`);

  // Filtered responders by role
  const filteredResponders = activeRoleFilter
    ? responders.filter(r => r.role === activeRoleFilter)
    : responders;

  // Handler for role button press
  const handleRoleFilter = (roleKey) => {
    setActiveRoleFilter(roleKey === activeRoleFilter ? null : roleKey);
  };

  // Hold-to-send SOS logic
  const [sosHold, setSosHold] = useState(false);
  const sosTimeout = useRef(null);

  const handleSOSPressIn = () => {
    setSosHold(true);
    sosTimeout.current = setTimeout(() => {
      setShowSosModal(true);
      setSosHold(false);
    }, 1200); // Hold for 1.2s
  };
  const handleSOSPressOut = () => {
    setSosHold(false);
    if (sosTimeout.current) {clearTimeout(sosTimeout.current);}
  };

  // Sidebar open handler (assumes Drawer navigation is set up)
  const openSidebar = () => navigation.openDrawer && navigation.openDrawer();

  // Logout handler (assumes AuthContext provides logout)
  const { logout } = useAuth();

  if (!userLocation || !isFinite(userLocation.latitude) || !isFinite(userLocation.longitude)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 }}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#333', textAlign: 'center' }}>Getting your location...</Text>
        {locationError && (
          <>
            <Text style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>{locationError}</Text>
            <TouchableOpacity
              style={{ marginTop: 16, backgroundColor: '#1976D2', padding: 12, borderRadius: 8 }}
              onPress={getLocation}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Retry Location</Text>
            </TouchableOpacity>
          </>
        )}
        {!locationError && (
          <TouchableOpacity
            style={{ marginTop: 16, backgroundColor: '#1976D2', padding: 12, borderRadius: 8 }}
            onPress={getLocation}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Retry Location</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafd' }}>
      <StatusBar barStyle="dark-content" backgroundColor={APP_HEADER_COLOR} />

      {/* Top Bar with user name */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openSidebar} style={styles.menuButton}>
          <MaterialIcons name="menu" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Welcome, {user?.name || 'User'}!</Text>
        </View>
        <UserAvatar
          avatarUrl={user?.avatar}
          onPress={() => navigation.navigate('ChangeProfilePic')}
          style={styles.avatar}
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapCard
            userLocation={userLocation}
            responders={filteredResponders}
            onRecenter={handleRecenter}
            loading={loadingResponders}
            error={responderError}
          />
        </View>

        {/* Role Filter Buttons */}
        <View style={styles.roleFilterContainer}>
          <View style={styles.roleFilterColumn}>
            {SOS_ROLES.slice(0, 2).map(role => (
              <TouchableOpacity
                key={role.key}
                onPress={() => handleRoleFilter(role.key)}
                style={[
                  styles.roleButton,
                  {
                    backgroundColor: activeRoleFilter === role.key ? role.color : 'rgba(0,0,0,0.03)',
                    shadowColor: activeRoleFilter === role.key ? role.color : 'transparent',
                  },
                ]}
              >
                <MaterialIcons
                  name={role.icon}
                  size={24}
                  color={activeRoleFilter === role.key ? '#fff' : role.color}
                  style={styles.roleIcon}
                />
                <Text style={[
                  styles.roleButtonText,
                  { color: activeRoleFilter === role.key ? '#fff' : '#222' },
                ]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.roleFilterColumn}>
            {SOS_ROLES.slice(2).map(role => (
              <TouchableOpacity
                key={role.key}
                onPress={() => handleRoleFilter(role.key)}
                style={[
                  styles.roleButton,
                  {
                    backgroundColor: activeRoleFilter === role.key ? role.color : 'rgba(0,0,0,0.03)',
                    shadowColor: activeRoleFilter === role.key ? role.color : 'transparent',
                  },
                ]}
              >
                <MaterialIcons
                  name={role.icon}
                  size={24}
                  color={activeRoleFilter === role.key ? '#fff' : role.color}
                  style={styles.roleIcon}
                />
                <Text style={[
                  styles.roleButtonText,
                  { color: activeRoleFilter === role.key ? '#fff' : '#222' },
                ]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {/* SOS Button */}
        <TouchableOpacity
          onPress={() => setShowSosModal(true)}
          activeOpacity={0.8}
          style={styles.sosButton}
        >
          <MaterialIcons name="sos" size={32} color="#fff" />
        </TouchableOpacity>

        {/* Chat Button */}
        <TouchableOpacity
          onPress={() => filteredResponders.length > 0 ? handleChat(filteredResponders[0]) : alert('No responders', 'No responders are currently available to chat.')}
          style={styles.chatButton}
        >
          <MaterialIcons name="chat" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* SOS Modal */}
      <SOSRoleModal
        visible={showSosModal}
        onSelect={role => {
          setSosRole(role);
          handleSendSOS(role);
        }}
        onCancel={() => setShowSosModal(false)}
        sending={sendingSOS}
        selectedRole={sosRole}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_HEADER_COLOR,
    paddingTop: 18,
    paddingBottom: 12,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
    marginRight: 10,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#e0f7fa',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    marginTop: 80, // Space for header
    marginBottom: 100, // Space for action buttons
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  roleFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  roleFilterColumn: {
    flexDirection: 'column',
    marginHorizontal: 8,
    flex: 1,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 22,
    marginVertical: 8,
    shadowOpacity: 0.13,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    minWidth: 140,
  },
  roleIcon: {
    marginRight: 10,
  },
  roleButtonText: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 20,
  },
  sosButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E53935',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  chatButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1976D2',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});

export default UserDashboard;
