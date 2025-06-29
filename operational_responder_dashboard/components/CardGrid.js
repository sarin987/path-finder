import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
let MdIcons;
if (Platform.OS === 'web') {
  MdIcons = require('react-icons/md');
} else {
  MdIcons = require('react-native-vector-icons/MaterialIcons');
}

const CardGrid = ({ items, onNavigate, isMobile }) => (
  <View style={[styles.grid, { justifyContent: isMobile ? 'center' : 'flex-start' }]}> 
    {items.map((item) => (
      <TouchableOpacity
        key={item.label}
        style={[styles.card, { width: isMobile ? 140 : 200, height: isMobile ? 120 : 160 }]}
        onPress={() => onNavigate(item.screen)}
        activeOpacity={0.85}
      >
        {Platform.OS === 'web' ? (
          React.createElement(MdIcons[item.icon], { size: 32, color: '#222e3a' })
        ) : (
          <MdIcons.default name={item.icon.replace('Md', '').replace(/^[A-Z]/, c => c.toLowerCase())} size={32} color="#222e3a" />
        )}
        <Text style={styles.cardLabel}>{item.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginTop: 16,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    margin: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    transition: 'transform 0.1s',
  },
  cardLabel: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222e3a',
    letterSpacing: 1,
  },
});

export default CardGrid;
