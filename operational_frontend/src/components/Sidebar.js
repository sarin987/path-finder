import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUserProfile } from '../hooks/useUserProfile';
import Logo from './Logo';

const MenuItem = ({ icon, label, onPress, isLogout, selected }) => (
  <TouchableOpacity 
    style={[
      styles.menuItem,
      selected && styles.selectedMenuItem,
      isLogout && styles.logoutItem
    ]}
    onPress={onPress}
  >
    <MaterialCommunityIcons 
      name={icon} 
      size={24} 
      color={isLogout ? "#dc2626" : selected ? "#1d4ed8" : "#4b5563"} 
    />
    <Text style={[
      styles.menuText,
      selected && styles.selectedMenuText,
      isLogout && styles.logoutText
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const sidebarMenuItems = [
  { key: 'dashboard', icon: 'home', label: 'Dashboard', screen: 'UserDashboard' },
  { key: 'reportIncident', icon: 'alert-circle', label: 'Report Incident', screen: 'ReportIncident' },
  { key: 'trustedContacts', icon: 'account-group', label: 'Trusted Contacts', screen: 'TrustedContacts' },
  { key: 'nearbyIncidents', icon: 'map-marker', label: 'Nearby Incidents', screen: 'NearbyIncidents' },
  { key: 'safeRoute', icon: 'navigation', label: 'Safe Route', screen: 'SafeRoute' },
];

const Sidebar = ({ sidebarAnimation, toggleSidebar, user, navigation, logout, onMenuSelect, selectedMenu }) => {
  const sidebarWidth = 280;
  const animationValue = sidebarAnimation ?? new Animated.Value(0);

  // Determine the current route name from navigation state if available
  let currentRoute = selectedMenu;
  if (navigation && navigation.getState) {
    const navState = navigation.getState();
    if (navState && navState.routes && navState.index != null) {
      const route = navState.routes[navState.index];
      // Find the menu key that matches the current route name
      const found = sidebarMenuItems.find(item => item.screen === route.name);
      if (found) currentRoute = found.key;
    }
  }

  return (
    <Animated.View 
      style={[
        styles.sidebar,
        { 
          transform: [{ translateX: animationValue }],
          width: sidebarWidth,
        }
      ]}
    >
      <View style={styles.header}>
        <Image source={require('../../assets/core_safety_logo.png')} style={styles.logo} />
        <Text style={styles.appName}>Core Safety</Text>
      </View>

      <View style={styles.menuContainer}>
        {sidebarMenuItems.map((item) => (
          <MenuItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            onPress={() => onMenuSelect(item.key)}
            selected={currentRoute === item.key}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <MenuItem
          icon="logout"
          label="Logout"
          onPress={logout}
          isLogout
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#f8fafc',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 1000,
  },
  header: {
    padding: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e0e7ef',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 14,
    color: '#1e293b',
    letterSpacing: 0.5,
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 18,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedMenuItem: {
    backgroundColor: '#e0e7ef',
    borderRightWidth: 4,
    borderRightColor: '#1d4ed8',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#334155',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  selectedMenuText: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 10,
    paddingTop: 18,
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default Sidebar;
