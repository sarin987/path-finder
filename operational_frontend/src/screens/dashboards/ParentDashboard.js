import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ParentDashboard = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parent Dashboard</Text>
      {/* Add your parent dashboard content here */}
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

export default ParentDashboard;
