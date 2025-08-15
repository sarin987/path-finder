import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppNavigator from './navigation/AppNavigator';
import { Platform, LogBox, View, Text } from 'react-native';
import { configureGoogleSignIn } from './utils/googleSignIn';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Setting a timer',
  'AsyncStorage has been extracted',
  'Remote debugger',
]);

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Google Sign-In
        console.log('Initializing Google Sign-In...');
        configureGoogleSignIn();
        
        // Initialize any other required services here
        console.log('Initializing app...');
        // TODO: Initialize Firebase here if needed
        // await initializeFirebase();
        
        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('App initialized successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        // Continue anyway for now
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Show a loading screen until the app is initialized
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
