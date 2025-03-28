import React, { createContext, useContext } from 'react';

export const colors = {
  primary: '#007AFF',
  primaryDark: '#0056b3',
  white: '#ffffff',
  black: '#000000',
  background: '#f7f9fc',
  blue: {
    main: '#007AFF',
    light: 'rgba(0, 122, 255, 0.1)'
  },
  gray: {
    50: '#f7f9fc',
    100: '#e4e9f2',
    200: '#8f9bb3',
    300: '#2e3a59'
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ colors }}>
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