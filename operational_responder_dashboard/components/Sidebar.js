import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import LogoutButton from './LogoutButton';
// Conditionally import icon libraries
let MdIcons;
if (Platform.OS === 'web') {
  MdIcons = require('react-icons/md');
  // Debug: log all available MdIcons for troubleshooting icon mapping
  if (typeof window !== 'undefined' && MdIcons) {
    const availableMdIcons = Object.keys(MdIcons).filter(k => typeof MdIcons[k] === 'function');
    console.log('Available MdIcons:', availableMdIcons);
  }
} else {
  MdIcons = require('react-native-vector-icons/MaterialIcons');
}

const defaultItems = [
  { label: 'Dashboard', icon: 'Dashboard', screen: 'dashboard' },
  { label: 'Incident', icon: 'ReportProblem', screen: 'incident' },
  { label: 'Live Map', icon: 'Map', screen: 'map' },
  { label: 'Media', icon: 'PhotoCamera', screen: 'media' },
  { label: 'History', icon: 'History', screen: 'history' },
  { label: 'Settings', icon: 'Settings', screen: 'settings' },
];

// Icon name mapping for web and native
const iconMapWeb = {
  Dashboard: 'MdDashboard',
  Incident: 'MdReportProblem',
  'Live Map': 'MdMap',
  Media: 'MdPhotoCamera',
  PhotoCamera: 'MdPhotoCamera',
  History: 'MdHistory',
  Settings: 'MdSettings',
};
const iconMapNative = {
  Dashboard: 'dashboard',
  Incident: 'report-problem',
  'Live Map': 'map',
  Media: 'photo-camera',
  PhotoCamera: 'photo-camera',
  History: 'history',
  Settings: 'settings',
};

const Sidebar = ({
  items = defaultItems,
  onNavigate = () => {},
  isMobile = false,
  sidebarWidth = 120,
  onLogout,
  activeScreen,
  currentPath,
  theme = 'dark',
  collapsed: collapsedProp = false,
  user = null,
  showVersion = false,
  version = '',
  notificationCounts = {},
}) => {
  // Collapsible state
  const [collapsed, setCollapsed] = useState(collapsedProp);
  // Determine active screen dynamically from currentPath if not provided
  let active = activeScreen;
  if (!active && currentPath) {
    const found = items.find(item => currentPath.toLowerCase().includes(item.screen.toLowerCase()));
    if (found) active = found.screen;
  }
  // Theme colors
  const isDark = theme === 'dark';
  const sidebarBg = isDark ? '#222e3a' : '#fff';
  const labelColor = isDark ? '#fff' : '#222e3a';
  const activeBg = isDark ? '#22304a' : '#e6eaf0';
  const activeColor = '#2e7ef7';

  return (
    <View style={[
      styles.sidebar,
      { backgroundColor: sidebarBg, width: collapsed ? 64 : isMobile ? '100%' : sidebarWidth + 40, flexDirection: isMobile ? 'row' : 'column', borderTopRightRadius: isMobile ? 0 : 24, borderBottomRightRadius: isMobile ? 0 : 24, minHeight: isMobile ? 60 : '100%' },
      collapsed && { alignItems: 'center', paddingLeft: 0, paddingRight: 0 },
    ]}>
      {/* User profile section */}
      {user && !isMobile && !collapsed && (
        <View style={styles.profileSection}>
          {user.avatar && <View style={styles.avatar}><Text>{user.avatar}</Text></View>}
          <Text style={styles.profileName}>{user.name || user.email || 'User'}</Text>
        </View>
      )}
      {/* Menu items */}
      {items.map((item) => {
        let iconComponent = null;
        if (Platform.OS === 'web') {
          const iconName = iconMapWeb[item.icon] || iconMapWeb[item.label];
          if (!iconName) {
            console.warn(`Sidebar: No icon mapping found for menu item '${item.label}' (icon: '${item.icon}'). Check iconMapWeb.`);
          }
          if (iconName && MdIcons[iconName]) {
            iconComponent = React.createElement(MdIcons[iconName], { size: 24, color: active === item.screen ? activeColor : labelColor });
          } else {
            // Fallback to MdHelpOutline if icon not found
            if (MdIcons['MdHelpOutline']) {
              console.warn(`Sidebar: Icon '${iconName}' not found in react-icons/md, using MdHelpOutline for menu item '${item.label}'.`);
              iconComponent = React.createElement(MdIcons['MdHelpOutline'], { size: 24, color: active === item.screen ? activeColor : labelColor });
            } else {
              console.error(`Sidebar: MdHelpOutline is missing from react-icons/md. No icon will be rendered for menu item '${item.label}'.`);
              iconComponent = null;
            }
          }
        } else {
          const iconName = iconMapNative[item.icon] || iconMapNative[item.label];
          iconComponent = <MdIcons.default name={iconName || 'help-outline'} size={24} color={active === item.screen ? activeColor : labelColor} />;
        }
        return (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.sidebarItem,
              active === item.screen && { backgroundColor: activeBg, borderRadius: 8 },
              collapsed && { marginHorizontal: 0, paddingHorizontal: 0, width: 56 },
            ]}
            onPress={() => onNavigate(item.screen)}
          >
            {iconComponent}
            {/* Always show label since collapse is removed */}
            <Text style={[
              styles.sidebarLabel,
              { color: active === item.screen ? activeColor : labelColor },
              active === item.screen && styles.activeSidebarLabel,
            ]}>{item.label}</Text>
            {/* Notification badge */}
            {notificationCounts[item.screen] > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{notificationCounts[item.screen]}</Text></View>
            )}
          </TouchableOpacity>
        );
      })}
      {/* Logout button at the bottom */}
      <View style={{ marginTop: 'auto', marginBottom: 8 }}>
        <LogoutButton onLogout={onLogout} buttonSize={isMobile ? undefined : 'small'} />
      </View>
      {/* Footer: version info */}
      {showVersion && !isMobile && (
        <Text style={styles.versionText}>v{version}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
    elevation: 8,
  },
  sidebarItem: {
    alignItems: 'center',
    marginVertical: 18,
    marginHorizontal: 16,
    flexDirection: 'row',
    position: 'relative',
  },
  sidebarLabel: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
    marginLeft: 8,
  },
  activeSidebarLabel: {
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
    top: 0,
    right: -10,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2e7ef7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  versionText: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 16,
    alignSelf: 'center',
  },
});

export default Sidebar;
