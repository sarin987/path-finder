import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, StatusBar, Alert, ActivityIndicator, Animated, Dimensions } from 'react-native';
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

const { height } = Dimensions.get('window');
const SOS_ROLES = [
  { key: 'police', label: 'Police', icon: 'local-police', color: '#1976D2' },
  { key: 'ambulance', label: 'Ambulance', icon: 'local-hospital', color: '#43A047' },
  { key: 'fire', label: 'Fire', icon: 'local-fire-department', color: '#E53935' },
  { key: 'parent', label: 'Parent', icon: 'supervisor-account', color: '#FBC02D' },
];

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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <HeaderBar user={user} onSettings={() => navigation.navigate('Profile')} />
      <StatusBanner message={statusMsg} type={statusType} />
      <View style={{ flex: 1, paddingHorizontal: 0, paddingTop: 0 }}>
        <View style={{ flex: 0.62, justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
          <View style={{ width: '94%', height: '100%', borderRadius: 24, overflow: 'hidden', elevation: 6, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
            <MapCard userLocation={userLocation} responders={filteredResponders} onRecenter={handleRecenter} />
            {/* Short SOS FAB at bottom right of map */}
            <View style={{ position: 'absolute', bottom: 18, right: 18, zIndex: 20 }}>
              <SOSButton onPress={() => setShowSosModal(true)} small />
            </View>
          </View>
        </View>
        {/* Responder Role Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginVertical: 12, marginHorizontal: 8 }}>
          {SOS_ROLES.map(role => (
            <View key={role.key} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: activeRoleFilter === role.key ? role.color : '#f0f0f0', elevation: activeRoleFilter === role.key ? 4 : 0 }}>
                <Text
                  onPress={() => handleRoleFilter(role.key)}
                  style={{ paddingVertical: 10, paddingHorizontal: 0, color: activeRoleFilter === role.key ? '#fff' : '#333', fontWeight: 'bold', fontSize: 15, textAlign: 'center', minWidth: 60 }}
                >
                  {role.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
        {/* Bottom Sheet Handle (always visible) */}
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <View style={{ width: 48, height: 6, borderRadius: 3, backgroundColor: '#ccc', marginBottom: 4 }} />
        </View>
        <ResponderBottomSheet
          responders={filteredResponders}
          onChat={handleChat}
          onCall={handleCall}
          onClose={() => setShowBottomSheet(false)}
          visible={showBottomSheet}
        />
      </View>
      <FloatingChatButton
        onPress={() => filteredResponders.length > 0 ? handleChat(filteredResponders[0]) : Alert.alert('No responders', 'No responders are currently available to chat.')}
        unreadCount={0}
      />
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
