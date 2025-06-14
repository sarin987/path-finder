import React, { useEffect, useRef } from 'react';
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
  { key: 'dashboard', icon: 'home', label: 'Dashboard' },
  { key: 'reportIncident', icon: 'alert-circle', label: 'Report Incident' },
  { key: 'trustedContacts', icon: 'account-group', label: 'Trusted Contacts' },
  { key: 'healthMonitor', icon: 'heart-pulse', label: 'Health Monitor' },
  { key: 'emergencyAlert', icon: 'bell-alert', label: 'Emergency Alert' },
  { key: 'nearbyIncidents', icon: 'map-marker', label: 'Nearby Incidents' },
  { key: 'safeRoute', icon: 'navigation', label: 'Safe Route' },
];

const Sidebar = ({ sidebarAnimation, toggleSidebar, user, navigation, logout, onMenuSelect, selectedMenu }) => {
  const { profile, loading } = useUserProfile();
  const sidebarWidth = 280;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { width: sidebarWidth }]}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.sidebar,
        { 
          transform: [{ translateX: sidebarAnimation }],
          width: sidebarWidth,
        }
      ]}
    >
      <View style={styles.header}>
        <Logo size={40} />
        <Text style={styles.appName}>Emergency Response</Text>
      </View>
      
      <View style={styles.userInfoContainer}>
        <View style={styles.avatarContainer}>
          {profile?.profile_photo ? (
            <Image 
              source={{ uri: profile.profile_photo }} 
              style={styles.avatar}
            />
          ) : (
            <MaterialCommunityIcons 
              name="account-circle" 
              size={60} 
              color="#4b5563" 
            />
          )}
        </View>
        <Text style={styles.userName} numberOfLines={1}>
          {profile?.name || user?.name || 'User'}
        </Text>
      </View>

      <View style={styles.menuContainer}>
        {sidebarMenuItems.map((item) => (
          <MenuItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            onPress={() => onMenuSelect(item.key)}
            selected={selectedMenu === item.key}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <MenuItem
          icon="cog"
          label="Settings"
          onPress={() => navigation.navigate('Settings')}
        />
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
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 1000,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#1e293b',
  },
  userInfoContainer: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  selectedMenuItem: {
    backgroundColor: '#f1f5f9',
    borderRightWidth: 3,
    borderRightColor: '#1d4ed8',
  },
  menuText: {
    fontSize: 15,
    marginLeft: 12,
    color: '#4b5563',
  },
  selectedMenuText: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 10,
    paddingTop: 15,
  },
  logoutText: {
    color: '#dc2626',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default Sidebar;
