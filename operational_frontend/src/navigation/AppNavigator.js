import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import UserDashboard from '../screens/dashboards/UserDashboard';
import Profile from '../screens/Profile/Profile';
import ChatScreen from '../screens/ChatScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false
        }}
      >
        {loading ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !user ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Main App
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={UserDashboard}
              options={{ 
                gestureEnabled: false
              }}
            />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen} 
              options={{ 
                headerShown: true,
                title: 'Chat',
                headerBackTitle: 'Back'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
