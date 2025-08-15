import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import IncidentList from '../components/IncidentList';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

// Map area (uses MapNative or MapWeb based on platform)
const MapNative = Platform.OS !== 'web' ? require('./MapNative').default : null;
const MapWeb = Platform.OS === 'web' ? require('./MapWeb').default : null;

function MapArea(props) {
  if (Platform.OS === 'web' && MapWeb) return <MapWeb {...props} />;
  if (MapNative) return <MapNative {...props} />;
  return <Text>Map not available.</Text>;
}

// Incident card UI
function IncidentCard({ onAccept }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.sosCircle}><Text style={styles.sosText}>SOS</Text></View>
        <View style={{flex:1}}>
          <Text style={styles.cardTitle}>SOS Alert <Text style={styles.cardTime}>1 min ago</Text></Text>
          <Text style={styles.cardLocation}>Mahalunge, Pune</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.iconButton}><Text>📷</Text></TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}><Text>🔊</Text></TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}><Text>🎤</Text></TouchableOpacity>
        <Text style={styles.cardUser}>Sekece d <Text style={{fontWeight:'bold'}}>Parent</Text></Text>
      </View>
      <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
        <Text style={styles.acceptButtonText}>ACCEPT</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function IncidentScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation();
  const sidebarItems = [
    { label: 'Dashboard', icon: 'Dashboard', screen: 'dashboard' },
    { label: 'Incident', icon: 'ReportProblem', screen: 'incident' },
    { label: 'Live Map', icon: 'Map', screen: 'map' },
    { label: 'Media', icon: 'PhotoCamera', screen: 'media' },
    { label: 'History', icon: 'Assessment', screen: 'history' },
    { label: 'Settings', icon: 'Settings', screen: 'settings' },
  ];
  const activeScreen = 'incident';
  const handleSidebarNavigate = (screen) => {
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
  };
  return (
    <View style={styles.root}>
      <Sidebar
        items={sidebarItems}
        onNavigate={handleSidebarNavigate}
        sidebarWidth={120}
        onLogout={logout}
        activeScreen={activeScreen}
      />
      <View style={styles.main}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Active Requests</Text>
          <View style={styles.onlineRow}>
            <Text style={styles.onlineText}>Online</Text>
            <View style={styles.toggleOn} />
          </View>
        </View>
        <MapArea />
        <IncidentList />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#f7f9fb' },
  main: { flex: 1, padding: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  header: { fontSize: 32, fontWeight: 'bold', color: '#222' },
  onlineRow: { flexDirection: 'row', alignItems: 'center' },
  onlineText: { fontSize: 16, marginRight: 8, color: '#222' },
  toggleOn: { width: 40, height: 24, borderRadius: 12, backgroundColor: '#2e7ef7', justifyContent: 'center', alignItems: 'flex-end', padding: 2 },
  mapContainer: { alignItems: 'center', marginBottom: 24 },
  map: { width: '100%', maxWidth: 700, height: 260, backgroundColor: '#e6eaf0', borderRadius: 16, overflow: 'hidden', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  mapText: { position: 'absolute', left: 16, bottom: 8, color: '#888', fontSize: 16 },
  sosMarker: { position: 'absolute', top: 90, left: 320, backgroundColor: '#e74c3c', borderRadius: 24, width: 48, height: 48, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  sosText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginTop: -40, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, maxWidth: 700, alignSelf: 'center' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sosCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  cardTime: { fontSize: 14, color: '#888', fontWeight: 'normal' },
  cardLocation: { fontSize: 16, color: '#444', marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  iconButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#e6eaf0', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  cardUser: { marginLeft: 12, fontSize: 16, color: '#444' },
  acceptButton: { backgroundColor: '#2e7ef7', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32, alignSelf: 'flex-end', marginTop: 8 },
  acceptButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
