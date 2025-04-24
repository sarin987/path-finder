import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>   
          <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
