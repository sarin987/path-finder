import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { API_ROUTES } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

const ParentDashboard = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_ROUTES.base}/api/incidents?recipient=parent`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      const data = await res.json();
      setIncidents(data.incidents || []);
    } catch (e) {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIncidents();
    setRefreshing(false);
  };

  const renderIncident = ({ item }) => (
    <View style={styles.incidentCard}>
      <Text style={styles.incidentType}>{item.type}</Text>
      <Text style={styles.incidentDesc}>{item.description}</Text>
      {item.photo_url ? (
        <Image source={{ uri: item.photo_url }} style={styles.incidentImage} />
      ) : null}
      <Text style={styles.incidentMeta}>
        Location: {item.location_lat}, {item.location_lng}
      </Text>
      <Text style={styles.incidentMeta}>
        Reported by: User {item.user_id}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Incident Reports for Parents</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#27ae60" />
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
          renderItem={renderIncident}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No incidents reported.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fb', padding: 16 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#27ae60' },
  incidentCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  incidentType: { fontSize: 16, fontWeight: 'bold', color: '#27ae60' },
  incidentDesc: { fontSize: 14, marginVertical: 4 },
  incidentImage: { width: '100%', height: 180, borderRadius: 6, marginVertical: 8 },
  incidentMeta: { fontSize: 12, color: '#666' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 32 },
});

export default ParentDashboard;
