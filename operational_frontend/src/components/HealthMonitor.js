import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList } from 'react-native';
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';

// Simulate health device integration (heart rate, fall detection)
const getSimulatedHealthData = () => {
  // In real app, integrate with Google Fit, Apple Health, or device SDKs
  const heart_rate = Math.floor(Math.random() * 120) + 40; // 40-160
  const fall_detected = Math.random() < 0.05; // 5% chance
  return { heart_rate, fall_detected };
};

const HealthMonitor = ({ userId }) => {
  const [lastEvent, setLastEvent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendHealthEvent = async () => {
    setLoading(true);
    const data = getSimulatedHealthData();
    let location = null;
    Geolocation.getCurrentPosition(
      (pos) => {
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        sendHealthEventRequest(data, location);
      },
      (error) => {
        sendHealthEventRequest(data, null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );
  };

  const sendHealthEventRequest = async (data, location) => {
    try {
      const res = await axios.post('http://localhost:5000/api/health/event', {
        user_id: userId,
        ...data,
        location,
      });
      setLastEvent({ ...data, alert_sent: res.data.alert_sent });
      fetchHistory();
    } catch (e) {
      alert('Failed to send health data');
    }
    setLoading(false);
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/health/history/${userId}`);
      setHistory(res.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Health Monitor</Text>
      <Button title={loading ? 'Sending...' : 'Send Health Data'} onPress={sendHealthEvent} disabled={loading} />
      {lastEvent && (
        <Text style={{ marginTop: 8 }}>
          Heart Rate: {lastEvent.heart_rate} | Fall: {lastEvent.fall_detected ? 'Yes' : 'No'} | Alert: {lastEvent.alert_sent ? 'Sent' : 'No'}
        </Text>
      )}
      <Text style={styles.subheader}>History</Text>
      <FlatList
        data={history}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <Text>
            {item.timestamp}: HR {item.heart_rate}, Fall {item.fall_detected ? 'Yes' : 'No'}, Alert {item.alert_sent ? 'Yes' : 'No'}
          </Text>
        )}
        style={{ marginTop: 8, maxHeight: 200 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  subheader: { fontWeight: 'bold', marginTop: 16 },
});

export default HealthMonitor;
