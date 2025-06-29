import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert, Dimensions } from 'react-native';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const MapNative = Platform.OS !== 'web' ? require('./MapNative').default : null;
const MapWeb = Platform.OS === 'web' ? require('./MapWeb').default : null;

export default function MapScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const { width } = Dimensions.get('window');
  const isMobile = width < 600;
  const SIDEBAR_WIDTH = 80;
  const sidebarItems = [
    { label: 'Dashboard', icon: 'Dashboard', screen: 'dashboard' },
    { label: 'Incident', icon: 'ReportProblem', screen: 'incident' },
    { label: 'Live Map', icon: 'Map', screen: 'map' },
    { label: 'Chat', icon: 'Chat', screen: 'chat' },
    { label: 'Media', icon: 'PhotoCamera', screen: 'media' },
    { label: 'History', icon: 'Assessment', screen: 'history' },
    { label: 'Settings', icon: 'Settings', screen: 'settings' },
  ];
  const activeScreen = 'map';

  const [incidents, setIncidents] = useState([]);
  const [responders, setResponders] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Fetch incidents
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'incidents'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filtered = data.filter(i => i.status !== 'resolved');
        setIncidents(filtered);
        console.log('[MapScreen] Incidents updated:', filtered);
      }
    );
    return () => unsub();
  }, []);

  // Fetch responders
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'responders'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResponders(data);
        console.log('[MapScreen] Responders updated:', data);
      }
    );
    return () => unsub();
  }, []);

  // Fetch user live location (simulate, replace with real logic as needed)
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(loc);
            console.log('[MapScreen] User location (web):', loc);
          },
          () => {
            const fallback = { lat: 20.5937, lng: 78.9629 };
            setUserLocation(fallback);
            console.log('[MapScreen] User location fallback (web):', fallback);
          }
        );
      } else {
        const fallback = { lat: 20.5937, lng: 78.9629 };
        setUserLocation(fallback);
        console.log('[MapScreen] User location fallback (web):', fallback);
      }
    } else {
      // Native: use react-native-geolocation or similar
      (async () => {
        try {
          const Geolocation = await import('react-native-geolocation-service');
          Geolocation.default.getCurrentPosition(
            pos => {
              const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserLocation(loc);
              console.log('[MapScreen] User location (native):', loc);
            },
            () => {
              const fallback = { lat: 20.5937, lng: 78.9629 };
              setUserLocation(fallback);
              console.log('[MapScreen] User location fallback (native):', fallback);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        } catch (e) {
          const fallback = { lat: 20.5937, lng: 78.9629 };
          setUserLocation(fallback);
          console.log('[MapScreen] Geolocation import failed, fallback (native):', fallback);
        }
      })();
    }
  }, []);

  // Handle incident tap/accept
  const handleIncidentSelect = (incident) => {
    setSelectedIncident(incident);
    console.log('[MapScreen] Incident selected:', incident);
    Alert.alert('Incident Selected', `Type: ${incident.type}\nTime: ${incident.time}`);
    // Optionally, trigger accept/respond logic here
  };

  return (
    <View style={styles.container}>
      <Sidebar
        items={sidebarItems}
        onNavigate={screen => {
          switch (screen) {
            case 'dashboard':
              navigation.navigate('Dashboard');
              break;
            case 'incident':
              navigation.navigate('Incident');
              break;
            case 'map':
              navigation.navigate('Map');
              break;
            case 'chat':
              navigation.navigate('Chat');
              break;
            case 'media':
              navigation.navigate('MediaCenter');
              break;
            case 'history':
              navigation.navigate('History');
              break;
            case 'settings':
              navigation.navigate('Settings');
              break;
            default:
              navigation.navigate(screen.charAt(0).toUpperCase() + screen.slice(1));
          }
        }}
        isMobile={isMobile}
        sidebarWidth={SIDEBAR_WIDTH}
        onLogout={logout}
        activeScreen={activeScreen}
      />
      <View style={styles.main}>
        <Text style={styles.title}>Live Map View</Text>
        {(() => {
          if (Platform.OS === 'web' && MapWeb) {
            return (
              <MapWeb
                userLocation={userLocation}
                responders={responders}
                incidents={incidents}
                onIncidentSelect={handleIncidentSelect}
              />
            );
          } else if (MapNative) {
            return (
              <MapNative
                userLocation={userLocation}
                responders={responders}
                incidents={incidents}
                onIncidentSelect={handleIncidentSelect}
              />
            );
          } else {
            return <Text>Map not available.</Text>;
          }
        })()}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const isMobile = width < 600;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: isMobile ? 'column' : 'row',
    backgroundColor: '#f5f7fa',
  },
  main: {
    flex: 1,
    padding: isMobile ? 16 : 40,
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  title: { fontSize: 20, fontWeight: 'bold', margin: 16 },
});
