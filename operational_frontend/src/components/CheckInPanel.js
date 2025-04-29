import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TextInput, StyleSheet } from 'react-native';
import axios from 'axios';

const CheckInPanel = ({ userId }) => {
  const [pending, setPending] = useState([]);
  const [scheduledTime, setScheduledTime] = useState('');
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [loading, setLoading] = useState(false);

  const fetchPending = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/checkin/pending/${userId}`);
      setPending(res.data);
    } catch (e) {}
  };

  useEffect(() => { fetchPending(); }, [userId]);

  const scheduleCheckIn = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/checkin/schedule', {
        user_id: userId,
        scheduled_time: scheduledTime,
        location_lat: location.lat,
        location_lng: location.lng,
      });
      setScheduledTime('');
      setLocation({ lat: '', lng: '' });
      fetchPending();
    } catch (e) {
      alert('Failed to schedule check-in');
    }
    setLoading(false);
  };

  const acknowledgeCheckIn = async (checkin_id) => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/checkin/ack', { checkin_id });
      fetchPending();
    } catch (e) {}
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Automated Emergency Check-ins</Text>
      <Text>Schedule a check-in (YYYY-MM-DD HH:MM:SS):</Text>
      <TextInput
        style={styles.input}
        value={scheduledTime}
        onChangeText={setScheduledTime}
        placeholder="Scheduled Time"
      />
      <TextInput
        style={styles.input}
        value={location.lat}
        onChangeText={lat => setLocation(l => ({ ...l, lat }))}
        placeholder="Latitude"
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        value={location.lng}
        onChangeText={lng => setLocation(l => ({ ...l, lng }))}
        placeholder="Longitude"
        keyboardType="numeric"
      />
      <Button title={loading ? 'Scheduling...' : 'Schedule Check-in'} onPress={scheduleCheckIn} disabled={loading} />
      <Text style={styles.header}>Pending Check-ins</Text>
      <FlatList
        data={pending}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.checkinItem}>
            <Text>At {item.scheduled_time} ({item.location_lat},{item.location_lng})</Text>
            <Button title="Acknowledge" onPress={() => acknowledgeCheckIn(item.id)} />
          </View>
        )}
        style={{ marginTop: 8 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontWeight: 'bold', fontSize: 16, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginVertical: 4 },
  checkinItem: { marginBottom: 12, padding: 8, borderWidth: 1, borderColor: '#eee', borderRadius: 4 },
});

export default CheckInPanel;
