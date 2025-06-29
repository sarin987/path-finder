import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function MediaCenterScreen() {
  const { logout } = useAuth();
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
  const activeScreen = 'media';

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
        <Text style={styles.title}>Media Center</Text>
        {/* Media files UI will go here */}
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
