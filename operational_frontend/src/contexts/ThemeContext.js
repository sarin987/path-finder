import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';

// Light theme colors
export const lightColors = {
  primary: '#1e88e5',
  primaryDark: '#1976d2',
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  notification: '#ff3d00',
  error: '#d32f2f',  
  success: '#388e3c',
  warning: '#f57c00',
  info: '#0288d1',
};

// Dark theme colors
export const darkColors = {
  primary: '#2196f3',
  primaryDark: '#1976d2',
  background: '#121212',
  card: '#1e1e1e',
  text: '#f5f5f5',
  textSecondary: '#b0b0b0',
  border: '#333333',
  notification: '#ff5252',
  error: '#ef5350',
  success: '#66bb6a',
  warning: '#ffa726',
  info: '#29b6f6',
};

const ThemeContext = createContext({
  isDarkMode: false,
  colors: lightColors,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  const [colors, setColors] = useState(isDark ? darkColors : lightColors);

  useEffect(() => {
    setColors(isDark ? darkColors : lightColors);
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = {
    isDarkMode: isDark,
    colors: colors,
    toggleTheme: toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Default theme values to use when outside of a provider
export const useTheme = () => {
  const context = useContext(ThemeContext);
  // Instead of throwing an error, return default light theme
  if (!context) {
    return {
      isDarkMode: false,
      colors: lightColors,
      toggleTheme: () => {},
    };
  }
  return context;
};

export default ThemeContext;
