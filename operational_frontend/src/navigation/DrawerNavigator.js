import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import UserDashboard from '../screens/dashboards/UserDashboard';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';
import { useAuth } from '../contexts/AuthContext';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const { logout, user } = useAuth();
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem
        label={`Logged in as: ${user?.name || 'User'}`}
        onPress={() => {}}
        labelStyle={{ fontWeight: 'bold', color: '#128090', marginBottom: 12 }}
        icon={({ color, size }) => <MaterialIcons name="person" color={color} size={size} />}
      />
      <DrawerItem
        label="Settings"
        onPress={() => props.navigation.navigate('Settings')}
        icon={({ color, size }) => <MaterialIcons name="settings" color={color} size={size} />}
      />
      <DrawerItem
        label="Logout"
        onPress={logout}
        icon={({ color, size }) => <MaterialIcons name="logout" color={color} size={size} />}
        labelStyle={{ color: '#E53935', fontWeight: 'bold' }}
      />
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="Dashboard" component={UserDashboard} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Chat" component={ChatScreen} />
    </Drawer.Navigator>
  );
}
