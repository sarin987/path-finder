import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, StatusBar, ActivityIndicator, Animated, Dimensions, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import HeaderBar from '../../components/dashboard/HeaderBar';
import MapCard from '../../components/dashboard/MapCard';
import SOSButton from '../../components/dashboard/SOSButton';
import SOSRoleModal from '../../components/dashboard/SOSRoleModal';
import ResponderBottomSheet from '../../components/dashboard/ResponderBottomSheet';
import FloatingChatButton from '../../components/dashboard/FloatingChatButton';
import StatusBanner from '../../components/dashboard/StatusBanner';
import socketManager from '../../utils/socket';
import { useNavigation } from '@react-navigation/native';
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

  // Get user location
  const getLocation = () => {
    setLoading(true);
    setLocationError(null);
    // First try: high accuracy, short timeout
    Geolocation.getCurrentPosition(
      pos => {
        console.log('Location success:', pos);
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLoading(false);
      },
      err => {
        console.log('Location error (first try):', err);
        if (err.code === 3) { // TIMEOUT
          // Retry with lower accuracy and longer timeout
          Geolocation.getCurrentPosition(
            pos2 => {
              console.log('Location success (retry):', pos2);
              setUserLocation({
                latitude: pos2.coords.latitude,
                longitude: pos2.coords.longitude,
              });
              setLoading(false);
            },
            err2 => {
              console.log('Location error (retry):', err2);
              // Try getLastKnownPosition if available
              if (Geolocation.getLastKnownPosition) {
                Geolocation.getLastKnownPosition(
                  pos3 => {
                    if (pos3) {
                      console.log('Last known location:', pos3);
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
          setLocationError(err?.message || 'Unable to get your location. Please ensure location is enabled and try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  // Get user location
  useEffect(() => {
    getLocation();
  }, []);

  // Connect to socket and get responders
  useEffect(() => {
    if (!user) return;
    const socket = socketManager.connect(user.token);
    socketManager.emit('user_location_update', {
      userId: user.id,
      role: 'user',
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      timestamp: new Date().toISOString(),
    });
    socket.on('responder_location_update', setResponders);
    return () => { socket.disconnect(); };
  }, [user, userLocation]);

  // SOS send
  const handleSendSOS = async (roleKey) => {
    if (!userLocation || !roleKey) return;
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
  const handleCall = (responder) => Alert.alert('Call', `Calling ${responder.name || responder.role}...`);

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
    if (sosTimeout.current) clearTimeout(sosTimeout.current);
  };

  // Sidebar open handler (assumes Drawer navigation is set up)
  const openSidebar = () => navigation.openDrawer && navigation.openDrawer();

  // Logout handler (assumes AuthContext provides logout)
  const { logout } = useAuth();

  if (loading || !userLocation) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 }}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#333', textAlign: 'center' }}>Getting your location...</Text>
        {locationError && (
          <>
            <Text style={{ color: 'red', marginTop: 10 }}>{locationError}</Text>
            <View style={{ marginTop: 16, backgroundColor: '#1976D2', padding: 10, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }} onPress={getLocation}>Retry</Text>
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafd' }}>
      <StatusBar barStyle="dark-content" backgroundColor={APP_HEADER_COLOR} />
      {/* Top Bar with user name */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: APP_HEADER_COLOR, paddingTop: 18, paddingBottom: 12, paddingHorizontal: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
        {/* Hamburger menu icon to open sidebar */}
        <TouchableOpacity onPress={openSidebar} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 6, elevation: 2, marginRight: 10 }}>
          <MaterialIcons name="menu" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#e0f7fa', fontWeight: 'bold', textAlign: 'center' }}>Welcome, {user?.name || 'User'}!</Text>
        </View>
        <UserAvatar avatarUrl={user?.avatar} onPress={() => navigation.navigate('ChangeProfilePic')} />
      </View>
      {/* Full-screen Map with top margin to avoid header overlap */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 1, top: 70 }]}> 
        <MapCard 
          userLocation={userLocation} 
          responders={filteredResponders} 
          onRecenter={handleRecenter} 
          showUserLabel
          largeIcons
          userDotStyle={{ borderWidth: 3, borderColor: '#fff', backgroundColor: '#2196F3', width: 16, height: 16, borderRadius: 8, shadowColor: '#2196F3', shadowOpacity: 0.18, shadowRadius: 6, elevation: 4 }}
          responderIconStyle={{ borderRadius: 14, backgroundColor: '#fff', padding: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 }}
        />
      </View>
      {/* Calm, large pill quick-access grid (2x2) */}
      <View style={{ position: 'absolute', bottom: 80, left: 0, right: 0, alignItems: 'center', zIndex: 15 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', backgroundColor: 'transparent' }}>
          <View style={{ flexDirection: 'column', marginRight: 8 }}>
            {[
              { key: 'police', label: 'Police', icon: 'local-police', color: '#1976D2' },
              { key: 'fire', label: 'Fire', icon: 'local-fire-department', color: '#FF9800' },
            ].map(role => (
              <TouchableOpacity
                key={role.key}
                onPress={() => handleRoleFilter(role.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 22,
                  marginVertical: 8,
                  backgroundColor: activeRoleFilter === role.key ? role.color : 'rgba(0,0,0,0.03)',
                  shadowColor: activeRoleFilter === role.key ? role.color : 'transparent',
                  shadowOpacity: activeRoleFilter === role.key ? 0.13 : 0,
                  shadowRadius: 6,
                  elevation: activeRoleFilter === role.key ? 3 : 0,
                  minWidth: 140,
                }}
              >
                <MaterialIcons name={role.icon} size={24} color={activeRoleFilter === role.key ? '#fff' : role.color} style={{ marginRight: 10 }} />
                <Text style={{ color: activeRoleFilter === role.key ? '#fff' : '#222', fontWeight: 'bold', fontSize: 17 }}>{role.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'column', marginLeft: 8 }}>
            {[
              { key: 'ambulance', label: 'Ambulance', icon: 'local-hospital', color: '#43A047' },
              { key: 'parent', label: 'Parent', icon: 'supervisor-account', color: '#8e24aa' },
            ].map(role => (
              <TouchableOpacity
                key={role.key}
                onPress={() => handleRoleFilter(role.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 22,
                  marginVertical: 8,
                  backgroundColor: activeRoleFilter === role.key ? role.color : 'rgba(0,0,0,0.03)',
                  shadowColor: activeRoleFilter === role.key ? role.color : 'transparent',
                  shadowOpacity: activeRoleFilter === role.key ? 0.13 : 0,
                  shadowRadius: 6,
                  elevation: activeRoleFilter === role.key ? 3 : 0,
                  minWidth: 140,
                }}
              >
                <MaterialIcons name={role.icon} size={24} color={activeRoleFilter === role.key ? '#fff' : role.color} style={{ marginRight: 10 }} />
                <Text style={{ color: activeRoleFilter === role.key ? '#fff' : '#222', fontWeight: 'bold', fontSize: 17 }}>{role.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      {/* Small floating SOS button */}
      <TouchableOpacity
        onPress={() => setShowSosModal(true)}
        activeOpacity={0.8}
        style={{ position: 'absolute', bottom: 18, left: 28, zIndex: 20, width: 62, height: 62, borderRadius: 31, backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center', shadowColor: '#E53935', shadowOpacity: 0.18, shadowRadius: 10, elevation: 8 }}
      >
        <MaterialIcons name="sos" size={32} color="#fff" />
      </TouchableOpacity>
      {/* Floating Chat Button */}
      <View style={{ position: 'absolute', bottom: 18, right: 28, zIndex: 21 }}>
        <TouchableOpacity onPress={() => filteredResponders.length > 0 ? handleChat(filteredResponders[0]) : Alert.alert('No responders', 'No responders are currently available to chat.')} style={{ backgroundColor: '#1976D2', width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', shadowColor: '#1976D2', shadowOpacity: 0.18, shadowRadius: 10, elevation: 8 }}>
          <MaterialIcons name="chat" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* SOS Modal (for role selection and sending) */}
      <SOSRoleModal
        visible={showSosModal}
        onSelect={role => { setSosRole(role); handleSendSOS(role); }}
        onCancel={() => setShowSosModal(false)}
        sending={sendingSOS}
        selectedRole={sosRole}
      />
    </SafeAreaView>
  );
};

export default UserDashboard;
