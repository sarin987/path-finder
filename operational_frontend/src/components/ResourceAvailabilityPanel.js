import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

const ResourceAvailabilityPanel = () => {
  const [vehicles, setVehicles] = useState([]);
  const [beds, setBeds] = useState([]);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/resources/availability');
        setVehicles(res.data.vehicles);
        setBeds(res.data.beds);
      } catch (e) {
        // ignore
      }
    };
    fetchAvailability();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Emergency Vehicles</Text>
      <FlatList
        data={vehicles}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <Text>{item.resource_type} ({item.status}) - {item.agency_name}</Text>
        )}
        style={{ marginBottom: 16 }}
      />
      <Text style={styles.header}>Hospital Beds</Text>
      <FlatList
        data={beds}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <Text>{item.hospital_name}: {item.available_beds} available / {item.total_beds} total</Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontWeight: 'bold', fontSize: 16, marginTop: 16 },
});

export default ResourceAvailabilityPanel;
