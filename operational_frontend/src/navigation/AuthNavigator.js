import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ParentRegisterScreen from '../screens/auth/ParentRegisterScreen';
import PoliceDashboard from '../screens/dashboards/PoliceDashboard';
import HospitalDashboard from '../screens/dashboards/HospitalDashboard';
import AmbulanceDashboard from '../screens/dashboards/AmbulanceDashboard';
import ParentDashboard from '../screens/dashboards/ParentDashboard';
import UserDashboard from '../screens/dashboards/UserDashboard';
import EmergencyRequest from '../screens/emergency/EmergencyRequest';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ParentRegister" component={ParentRegisterScreen} />
      
      {/* Role-specific Dashboards */}
      <Stack.Screen name="UserDashboard" component={UserDashboard} />
      <Stack.Screen name="PoliceDashboard" component={PoliceDashboard} />
      <Stack.Screen name="HospitalDashboard" component={HospitalDashboard} />
      <Stack.Screen name="AmbulanceDashboard" component={AmbulanceDashboard} />
      <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
      
      {/* Emergency Request Screen */}
      <Stack.Screen 
        name="EmergencyRequest" 
        component={EmergencyRequest}
        options={{
          headerShown: true,
          headerTitle: "",
          headerTransparent: true,
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
