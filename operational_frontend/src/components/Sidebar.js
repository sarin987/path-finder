import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUserProfile } from '../hooks/useUserProfile';
import { Storage, StorageKeys } from '../utils/storage';
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
  { key: 'dashboard', icon: 'home', label: 'Dashboard Overview' },
  { key: 'reportIncident', icon: 'alert-circle', label: 'Report Incident' },
  { key: 'trustedContacts', icon: 'account-group', label: 'Trusted Contacts' },
  { key: 'healthMonitor', icon: 'heart-pulse', label: 'Health Monitor' },
  { key: 'emergencyAlert', icon: 'bell-alert', label: 'Emergency Alert' },
  { key: 'nearbyIncidents', icon: 'map-marker', label: 'Nearby Incidents' },
  { key: 'safeRoute', icon: 'navigation', label: 'Safe Route Suggester' },
  { key: 'resourceAvailability', icon: 'database', label: 'Resource Availability' },
  { key: 'agencyCollaboration', icon: 'handshake', label: 'Agency Collaboration' },
];

const slimSidebarMenuItems = [
  { key: 'reportIncident', icon: 'alert-circle', label: 'Report' },
  { key: 'trustedContacts', icon: 'account-group', label: 'Contacts' },
  { key: 'healthMonitor', icon: 'heart-pulse', label: 'Health' },
  { key: 'emergencyAlert', icon: 'bell-alert', label: 'Alert' },
];

const Sidebar = ({ sidebarAnimation = new Animated.Value(-300), toggleSidebar, user, navigation, logout, onMenuSelect, selectedMenu }) => {
  const { profile, loading, error, refetch } = useUserProfile(user?.id);

  useEffect(() => {
    const checkUserAuth = async () => {
      const userData = await Storage.getItem(StorageKeys.USER_DATA);
      console.log('Stored user data:', userData);
      
      if (!userData && !user) {
        console.log('No user data found, redirecting to login');
        navigation.replace('Login');
      }
    };

    checkUserAuth();
  }, [user, navigation]);

  const renderUserInfo = () => {
    if (!user) {
      console.log('No user data available');
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="account-alert" size={24} color="#FF4444" />
          <Text style={styles.errorText}>User not authenticated</Text>
        </View>
      );
    }

    if (loading) {
      return <ActivityIndicator size="large" color="#007AFF" />;
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert" size={24} color="#FF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const displayName = profile?.name || user?.name || 'User';
    const displayPhone = profile?.phone || user?.phone || 'No phone number';
    const displayRole = profile?.role || user?.role || 'user';

    return (
      <View style={styles.userInfoContainer}>
        {profile?.photo ? (
          <Image 
            source={{ uri: profile.photo }} 
            style={styles.profileImage}
            defaultSource={require('../assets/images/person.png')}
          />
        ) : (
          <MaterialCommunityIcons 
            name="account-circle" 
            size={60} 
            color="#007AFF" 
          />
        )}
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userPhone}>{displayPhone}</Text>
        <Text style={styles.userRole}>{displayRole}</Text>
      </View>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.sidebar,
        { transform: [{ translateX: sidebarAnimation }] },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Logo size="medium" animated={true} />
        </View>

        <View style={styles.userInfo}>
          {renderUserInfo()}
        </View>

        <View style={styles.menuContainer}>
          {sidebarMenuItems.map(item => (
            <MenuItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              onPress={() => onMenuSelect(item.key)}
              selected={selectedMenu === item.key}
              isLogout={false}
            />
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.menuContainer}>
          <MenuItem
            icon="cog"
            label="Settings"
            onPress={() => navigation.navigate('Settings')}
            isLogout={false}
            selected={false}
          />
          <MenuItem
            icon="logout"
            label="Logout"
            onPress={logout}
            isLogout={true}
            selected={false}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const SlimSidebar = ({ onMenuSelect, selectedMenu, navigation, logout, user }) => (
  <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 40, paddingHorizontal: 10 }}>
    <View style={{ alignItems: 'center', marginBottom: 30 }}>
      <MaterialCommunityIcons name="account-circle" size={60} color="#007AFF" />
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginTop: 10 }}>{user?.name || 'User'}</Text>
    </View>
    <View style={{ flex: 0, marginBottom: 24 }}>
      {slimSidebarMenuItems.map(item => (
        <TouchableOpacity
          key={item.key}
          onPress={() => onMenuSelect(item.key)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 18,
            paddingHorizontal: 18,
            borderRadius: 12,
            backgroundColor: selectedMenu === item.key ? '#e0e7ff' : 'transparent',
            marginBottom: 4,
          }}
        >
          <MaterialCommunityIcons name={item.icon} size={28} color={selectedMenu === item.key ? '#1d4ed8' : '#64748b'} />
          <Text style={{ marginLeft: 16, fontSize: 17, color: selectedMenu === item.key ? '#1d4ed8' : '#64748b', fontWeight: selectedMenu === item.key ? 'bold' : '500' }}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
    <View style={{ borderTopWidth: 1, borderColor: '#e5e7eb', marginTop: 10, paddingTop: 14, marginBottom: 10 }}>
      <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <MaterialCommunityIcons name="cog" size={24} color="#64748b" />
        <Text style={{ marginLeft: 16, fontSize: 16, color: '#64748b' }}>Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={logout} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialCommunityIcons name="logout" size={24} color="#dc2626" />
        <Text style={{ marginLeft: 16, fontSize: 16, color: '#dc2626' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  sidebar: {
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    paddingTop: 0,
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userInfoContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  menuContainer: {
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 8,
    borderRadius: 8,
  },
  selectedMenuItem: {
    backgroundColor: '#e0e7ff',
  },
  menuText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#4b5563',
    fontWeight: '500',
  },
  selectedMenuText: {
    color: '#1d4ed8',
    fontWeight: 'bold',
  },
  logoutItem: {
    marginTop: 'auto',
    backgroundColor: '#fef2f2',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  logoutText: {
    color: '#dc2626',
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  logoSection: {
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default Sidebar;
export { SlimSidebar };
