import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

const StatusToggle = ({ isOnline, setIsOnline }) => (
  <View style={styles.statusToggle}>
    <Text style={styles.statusText}>{isOnline ? 'Go Offline' : 'Go Online'}</Text>
    <Switch
      value={isOnline}
      onValueChange={setIsOnline}
      thumbColor={isOnline ? '#2196f3' : '#ccc'}
      trackColor={{ false: '#bbb', true: '#b3e5fc' }}
    />
  </View>
);

const styles = StyleSheet.create({
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    elevation: 2,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
    marginRight: 8,
    color: '#222e3a',
  },
});

export default StatusToggle;
