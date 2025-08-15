import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MapScreen from '../screens/MapScreen';
import MediaCenterScreen from '../screens/MediaCenterScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import IncidentScreen from '../screens/IncidentScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "Dashboard" : "Login"}>
        {!user && (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
          </>
        )}
        {user && (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Incident" component={IncidentScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="MediaCenter" component={MediaCenterScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
