import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import database from '@react-native-firebase/database';

const IncidentMap = () => {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const ref = database().ref('incidents');
    ref.on('value', (snapshot) => {
      const data = snapshot.val();
      setIncidents(Object.values(data || {}));
    });
    return () => ref.off();
  }, []);

  return (
    <View style={styles.container}>
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
            coordinate={{ latitude: incident.lat, longitude: incident.lng }}
            title={incident.type}
            description={incident.description }
          >
            <Callout>
              <Text>{incident.type}</Text>
              <Text>{incident.description}</Text>
              {incident.photo_url ? <Text>Photo: {incident.photo_url}</Text> : null}
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.5 },
});

export default IncidentMap;
