import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = ({ style }) => {
  const { isDarkMode, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={toggleTheme}
    >
      <MaterialCommunityIcons
        name={isDarkMode ? 'weather-sunny' : 'weather-night'}
        size={24}
        color={colors.gray[300]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
});
