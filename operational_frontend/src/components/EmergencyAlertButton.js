import React, { useState, useCallback } from 'react';
import { View, Button, Text, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PermissionsAndroid } from 'react-native';

const EmergencyAlertButton = () => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useAuth();

  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  }, []);

  const sendAlert = useCallback(async () => {
    if (sending) {return;}

    setSending(true);

    try {
      // Request location permission if not already granted
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to send emergency alerts.'
        );
        return;
      }

      // Get current location
      const position = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
        );
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Send alert to backend
      await api.post('/alerts', {
        userId: user?.id,
        message: 'Emergency! Please check on me.',
        location,
        timestamp: new Date().toISOString(),
      });

      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      console.error('Error sending alert:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send alert. Please try again.'
      );
    } finally {
      setSending(false);
    }
  }, [sending, user, requestLocationPermission]);

  return (
    <View style={styles.container}>
      <Button
        title={sending ? 'Sending Alert...' : sent ? 'Alert Sent!' : 'Send Emergency Alert'}
        onPress={sendAlert}
        color={sent ? 'green' : 'red'}
        disabled={sending || sent}
      />
      {sending && <ActivityIndicator style={{ marginTop: 8 }} />}
      {sent && <Text style={{ color: 'green', marginTop: 8 }}>Your contacts have been notified.</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
  },
});

export default EmergencyAlertButton;
