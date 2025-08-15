import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { alert } from '../utils/alert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const LogoutScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await auth().signOut(); // ✅ Firebase sign-out
        await AsyncStorage.clear(); // ✅ Clear stored user data

        alert('Logged Out', 'You have been logged out successfully.');

        // ✅ Navigate to Login screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'LoginScreen' }], // Make sure "LoginScreen" exists in the navigator
        });

      } catch (error) {
        console.error('Logout Error:', error);
        alert('Error', 'Logout failed. Please try again.');
      }
    };

    handleLogout(); // Call the function immediately when the screen loads

  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text>Logging out...</Text>
    </View>
  );
};

export default LogoutScreen;
