import React, { useState } from 'react';
import { View, Button, Text, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';

const EmergencyAlertButton = ({ userId }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const sendAlert = async () => {
    setSending(true);
    let location = null;
    Geolocation.getCurrentPosition(
      (pos) => {
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        sendAlertRequest(location);
      },
      (error) => {
        alert('Permission to access location was denied or unavailable');
        setSending(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );
  };

  const sendAlertRequest = async (location) => {
    try {
      await axios.post('http://localhost:5000/api/contacts/alert', {
        user_id: userId,
        alert_message: 'Emergency! Please check on me.',
        location,
      });
      setSent(true);
    } catch (e) {
      alert('Failed to send alert');
    }
    setSending(false);
  };

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
  container: { marginVertical: 16, alignItems: 'center' },
});

export default EmergencyAlertButton;
