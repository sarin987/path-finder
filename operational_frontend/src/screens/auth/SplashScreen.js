import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const SplashScreen = ({ navigation }) => {
  const { checkAuthState, loading } = useAuth();

  useEffect(() => {
    const initializeApp = async () => {
      const isAuthenticated = await checkAuthState();
      
      // Navigate based on auth state
      if (isAuthenticated) {
        navigation.replace('UserDashboard');
      } else {
        navigation.replace('Login');
      }
    };

    initializeApp();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SplashScreen;