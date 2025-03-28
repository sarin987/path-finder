import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import PoliceDashboard from '../screens/dashboards/PoliceDashboard';
import HospitalDashboard from '../screens/dashboards/HospitalDashboard';
import AmbulanceDashboard from '../screens/dashboards/AmbulanceDashboard';
import UserDashboard from '../screens/dashboards/UserDashboard';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PoliceDashboard" component={PoliceDashboard} />
      <Stack.Screen name="HospitalDashboard" component={HospitalDashboard} />
      <Stack.Screen name="AmbulanceDashboard" component={AmbulanceDashboard} />
      <Stack.Screen name="UserDashboard" component={UserDashboard} />
    </Stack.Navigator>
  );
};

export default AppNavigator;