import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const SessionExpiredScreen = () => {
  const { resetSession } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Expired</Text>
      <Text style={styles.message}>
        Your session has expired due to inactivity. Please log in again to continue.
      </Text>
      <Button 
        title="Back to Login" 
        onPress={resetSession}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    width: '80%',
    marginTop: 20,
  },
});

export default SessionExpiredScreen;
