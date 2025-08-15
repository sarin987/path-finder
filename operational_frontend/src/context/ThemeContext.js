import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { lightColors, darkColors } from '../styles/colors';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  
  // Toggle between dark and light theme
  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Get the appropriate color scheme based on the theme mode
  const theme = useMemo(() => ({
    colors: isDarkMode ? darkColors : lightColors,
    isDarkMode,
    toggleTheme,
  }), [isDarkMode]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
