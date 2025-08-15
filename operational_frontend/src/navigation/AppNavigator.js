import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DrawerNavigator from './DrawerNavigator';
import ChangeProfilePic from '../screens/ChangeProfilePic';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
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
          // Main App with Drawer
          <>
            <Stack.Screen name="Main" component={DrawerNavigator} />
            <Stack.Screen name="ChangeProfilePic" component={ChangeProfilePic} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
