import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Notification = ({ message, type = 'info' }) => {
  const backgroundColor =
    type === 'success' ? '#4CAF50' :
    type === 'error' ? '#F44336' :
    type === 'warning' ? '#FFC107' :
    '#2196F3';
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 8,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Notification;
