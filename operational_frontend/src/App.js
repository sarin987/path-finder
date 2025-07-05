import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppNavigator from './navigation/AppNavigator';
import { initializeFirebase, setupMessageHandlers } from './config/firebase';
import { Platform, LogBox } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Setting a timer',
  'AsyncStorage has been extracted',
  'Remote debugger',
]);

const App = () => {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    const initializeAppAsync = async () => {
      try {
        console.log('Initializing Firebase...');
        await initializeFirebase();
        
        // Set up message handlers
        await setupMessageHandlers(remoteMessage => {
          console.log('Received message:', remoteMessage);
          // Handle your messages here
        });
        
        console.log('Firebase initialized successfully');
        setFirebaseInitialized(true);
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        // You might want to show an error screen or retry logic here
        setFirebaseInitialized(true); // Continue anyway for now
      }
    };

    initializeAppAsync();
  }, []);

  // Show a loading screen until Firebase is initialized
  if (!firebaseInitialized) {
    return null; // Or a loading component
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
