import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

const AgencyCollaborationPanel = () => {
  const [agencies, setAgencies] = useState([]);
  const [resources, setResources] = useState([]);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [agRes, resRes, incRes] = await Promise.all([
          axios.get('http://localhost:5000/api/agencies/all'),
          axios.get('http://localhost:5000/api/agencies/resources'),
          axios.get('http://localhost:5000/api/agencies/incidents'),
        ]);
        setAgencies(agRes.data);
        setResources(resRes.data);
        setIncidents(incRes.data);
      } catch (e) {
        // ignore
      }
    };
    fetchAll();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Agencies</Text>
      <FlatList
        data={agencies}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <Text>{item.name} ({item.type})</Text>
        )}
        style={{ marginBottom: 16 }}
      />
      <Text style={styles.header}>Resources</Text>
      <FlatList
        data={resources}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <Text>{item.resource_type} ({item.status}) - {item.agency_name}</Text>
        )}
        style={{ marginBottom: 16 }}
      />
      <Text style={styles.header}>Active Agency Incidents</Text>
      <FlatList
        data={incidents}
        keyExtractor={item => item.id.toString() + '-' + item.incident_id}
        renderItem={({ item }) => (
          <Text>{item.agency_name}: {item.type} at {item.lat},{item.lng} ({item.timestamp})</Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontWeight: 'bold', fontSize: 16, marginTop: 16 },
});

export default AgencyCollaborationPanel;
