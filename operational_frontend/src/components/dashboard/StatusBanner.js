import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusBanner = ({ message, type }) => {
  if (!message) return null;
  const bgColor = type === 'error' ? '#E53935' : type === 'success' ? '#43A047' : '#1976D2';
  return (
    <View style={[styles.banner, { backgroundColor: bgColor }] }>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: { width: '100%', padding: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginVertical: 6 },
  text: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

export default StatusBanner;
