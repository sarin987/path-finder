import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function ReportsScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation();
  const { width } = Dimensions.get('window');
  const isMobile = width < 600;
  const SIDEBAR_WIDTH = 80;
  const sidebarItems = [
    { label: 'Dashboard', icon: 'Dashboard', screen: 'dashboard' },
    { label: 'Live Map', icon: 'Map', screen: 'map' },
    { label: 'Media', icon: 'PhotoCamera', screen: 'media' },
    { label: 'Reports', icon: 'Assessment', screen: 'reports' },
    { label: 'Settings', icon: 'Settings', screen: 'settings' },
  ];
  const activeScreen = 'reports';

  return (
    <View style={styles.container}>
      <Sidebar
        items={sidebarItems}
        onNavigate={screen => {
          switch (screen) {
            case 'dashboard':
              navigation.navigate('Dashboard');
              break;
            case 'map':
              navigation.navigate('Map');
              break;

            case 'media':
              navigation.navigate('MediaCenter');
              break;
            case 'reports':
              navigation.navigate('Reports');
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
        <Text style={styles.title}>Incident Reports</Text>
        {/* Reports table UI will go here */}
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
