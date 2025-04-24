import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import UserDashboard from '../screens/dashboards/UserDashboard';
import Profile from '../screens/Profile/Profile';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="UserDashboard"
        screenOptions={{
          headerShown: false
        }}
      >
        {loading ? (
          // Splash Screen
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !user ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // App Stack
          <>
            <Stack.Screen 
              name="UserDashboard" 
              component={UserDashboard}
              options={{ gestureEnabled: false }}
            />
            
            <Stack.Screen name="Profile" component={Profile} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;