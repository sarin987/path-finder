import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AmbulanceDashboard = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ambulance Dashboard</Text>
      {/* Add your ambulance dashboard content here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default AmbulanceDashboard;
