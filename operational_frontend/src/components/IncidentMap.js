import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import api from '../services/api';

const IncidentMap = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const response = await api.get('/incidents');
        setIncidents(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching incidents:', err);
        setError('Failed to load incidents');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();

    // Set up polling to fetch incidents every 30 seconds
    const interval = setInterval(fetchIncidents, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 20.5937,
            longitude: 78.9629,
            latitudeDelta: 10,
            longitudeDelta: 10,
          }}
        >
          {incidents.map((incident, idx) => (
            <Marker
              key={idx}
              coordinate={{
                latitude: incident.lat,
                longitude: incident.lng,
              }}
              title={incident.type}
              description={incident.description}
            >
              <Callout>
                <Text>{incident.type}</Text>
                <Text>{incident.description}</Text>
                {incident.photo_url && (
                  <Text>Photo: {incident.photo_url}</Text>
                )}
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});

export default IncidentMap;
