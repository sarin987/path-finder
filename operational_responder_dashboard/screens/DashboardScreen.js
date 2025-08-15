import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Sidebar from '../components/Sidebar';
import StatusToggle from '../components/StatusToggle';
import CardGrid from '../components/CardGrid';
import LogoutButton from '../components/LogoutButton';

// Conditionally import icon libraries
let MdIcons;
if (Platform.OS === 'web') {
  MdIcons = require('react-icons/md');
} else {
  MdIcons = require('react-native-vector-icons/MaterialIcons');
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [isOnline, setIsOnline] = useState(true);
  const { width } = Dimensions.get('window');
  const isMobile = width < 600;
  const SIDEBAR_WIDTH = 80;
  // Use the common sidebar items and activeScreen
  const sidebarItems = [
    { label: 'Dashboard', icon: 'Dashboard', screen: 'dashboard' },
    { label: 'Incident', icon: 'ReportProblem', screen: 'incident' },
    { label: 'Live Map', icon: 'Map', screen: 'map' },
    { label: 'Media', icon: 'PhotoCamera', screen: 'media' },
    { label: 'History', icon: 'Assessment', screen: 'history' },
    { label: 'Settings', icon: 'Settings', screen: 'settings' },
  ];
  // Determine active screen (example: 'dashboard')
  const activeScreen = 'dashboard'; // You may want to get this from navigation state

  // Add cardItems definition here to fix the error
  const cardItems = [
    { label: 'LIVE MAP', icon: 'MdLocationOn', screen: 'Map' },
    { label: 'REPORTS', icon: 'MdImage', screen: 'Reports' },
  ];

  return (
    <View style={styles.container}>
      {/* Sidebar */}
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
      {/* Main Content */}
      <View style={styles.main}>
        <View style={styles.header}>
          <Text style={styles.title}>Responder Dashboard</Text>
          <StatusToggle isOnline={isOnline} setIsOnline={setIsOnline} />
        </View>
        <Text style={styles.welcome}>
          Welcome{user?.email ? `, ${user.email}` : ''}
        </Text>
        <CardGrid
          items={cardItems}
          onNavigate={screen => {
            // Navigate to Incident screen when 'Overview' is clicked
            if (screen === 'Overview') {
              navigation.navigate('Incident');
            } else {
              navigation.navigate(screen);
            }
          }}
          isMobile={isMobile}
        />
        {/* <LogoutButton onLogout={logout} /> */}
      </View>
    </View>
  );
}

// Responsive styles
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
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222e3a',
  },
  welcome: {
    fontSize: 16,
    color: '#666',
    marginBottom: 18,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
});
