import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

export const Sidebar = ({ children }) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView>
        {children}
      </ScrollView>
      <ThemeToggle style={styles.themeToggle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '80%',
    maxWidth: 300,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  themeToggle: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});
