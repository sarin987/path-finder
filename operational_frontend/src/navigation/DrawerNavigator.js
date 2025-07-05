import React, { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import UserDashboard from '../screens/dashboards/UserDashboard';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import TrustedContactsScreen from '../screens/TrustedContactsScreen';
import SafeRouteScreen from '../screens/SafeRouteScreen';
import { useNavigationState } from '@react-navigation/native';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  const { logout, user } = useAuth();
  const [selectedMenu, setSelectedMenu] = useState('dashboard');

  // Handler for menu selection
  const handleMenuSelect = (key, navigation) => {
    setSelectedMenu(key);
    switch (key) {
      case 'dashboard':
        navigation.navigate('UserDashboard');
        break;
      case 'reportIncident':
        navigation.navigate('ReportIncident');
        break;
      case 'trustedContacts':
        navigation.navigate('TrustedContacts');
        break;
      case 'healthMonitor':
        navigation.navigate('HealthMonitor');
        break;
      case 'emergencyAlert':
        navigation.navigate('EmergencyAlert');
        break;
      case 'nearbyIncidents':
        navigation.navigate('NearbyIncidents');
        break;
      case 'safeRoute':
        navigation.navigate('SafeRoute');
        break;
      default:
        navigation.navigate('UserDashboard');
    }
  };

  // Sync selectedMenu with current route
  const navigationState = useNavigationState(state => state);
  useEffect(() => {
    if (!navigationState) return;
    const route = navigationState.routes[navigationState.index];
    switch (route.name) {
      case 'UserDashboard':
        setSelectedMenu('dashboard');
        break;
      case 'ReportIncident':
        setSelectedMenu('reportIncident');
        break;
      case 'TrustedContacts':
        setSelectedMenu('trustedContacts');
        break;
      case 'HealthMonitor':
        setSelectedMenu('healthMonitor');
        break;
      case 'EmergencyAlert':
        setSelectedMenu('emergencyAlert');
        break;
      case 'NearbyIncidents':
        setSelectedMenu('nearbyIncidents');
        break;
      case 'SafeRoute':
        setSelectedMenu('safeRoute');
        break;
      default:
        setSelectedMenu('dashboard');
    }
  }, [navigationState]);

  return (
    <Drawer.Navigator
      drawerContent={props => (
        <Sidebar
          {...props}
          user={user}
          logout={logout}
          navigation={props.navigation}
          onMenuSelect={key => handleMenuSelect(key, props.navigation)}
          selectedMenu={selectedMenu}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="UserDashboard" component={UserDashboard} />
      <Drawer.Screen name="ReportIncident" component={require('../screens/ReportIncident').default} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Chat" component={ChatScreen} />
      <Drawer.Screen name="TrustedContacts" component={TrustedContactsScreen} />
      <Drawer.Screen name="SafeRoute" component={SafeRouteScreen} />
      {/* Add other screens as needed */}
    </Drawer.Navigator>
  );
}
