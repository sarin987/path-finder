import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PoliceDashboard = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Police Dashboard</Text>
      {/* Add your police dashboard content here */}
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

export default PoliceDashboard;
