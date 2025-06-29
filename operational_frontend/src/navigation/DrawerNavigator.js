import React, { useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import UserDashboard from '../screens/dashboards/UserDashboard';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';

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
      {/* Add other screens as needed */}
    </Drawer.Navigator>
  );
}
