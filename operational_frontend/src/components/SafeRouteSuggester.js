import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import axios from 'axios';

const SafeRouteSuggester = ({ userLocation }) => {
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState(null);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSuggestRoute = async () => {
    if (!userLocation || !destination) return;
    setLoading(true);
    try {
      // For demo: destination as "lat,lng"
      const [destLat, destLng] = destination.split(',').map(Number);
      const res = await axios.post('http://localhost:5000/api/routes/safe', {
        start: { lat: userLocation.latitude, lng: userLocation.longitude },
        end: { lat: destLat, lng: destLng },
      });
      setRoute(res.data.route);
      setRisks(res.data.risks);
    } catch (e) {
      alert('Failed to get safe route');
    }
    setLoading(false);
  };

  // Extract polyline points from Google Directions API response
  const getPolylineCoords = () => {
    if (!route) return [];
    return route.legs[0].steps.map(step => ({
      latitude: step.start_location.lat,
      longitude: step.start_location.lng
    })).concat({
      latitude: route.legs[0].end_location.lat,
      longitude: route.legs[0].end_location.lng
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Safe Route Suggester</Text>
      <Text>Enter destination as "lat,lng" (e.g. 12.9716,77.5946):</Text>
      <TextInput
        style={styles.input}
        value={destination}
        onChangeText={setDestination}
        placeholder="Destination lat,lng"
      />
      <Button title={loading ? 'Checking...' : 'Suggest Safe Route'} onPress={handleSuggestRoute} disabled={loading} />
      {route && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          <Marker coordinate={userLocation} title="Start" />
          <Marker coordinate={{ latitude: Number(destination.split(',')[0]), longitude: Number(destination.split(',')[1]) }} title="Destination" />
          <Polyline coordinates={getPolylineCoords()} strokeColor="blue" strokeWidth={3} />
          {risks.map((risk, idx) => (
            <Marker
              key={idx}
              coordinate={{ latitude: risk.lat, longitude: risk.lng }}
              pinColor="red"
              title={risk.risk_type}
              description={risk.description}
            />
          ))}
        </MapView>
      )}
      {risks.length > 0 && (
        <Text style={{ color: 'red', marginTop: 8 }}>Warning: Unsafe areas detected along this route!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginVertical: 8 },
  map: { width: '100%', height: 250, marginTop: 8 },
});

export default SafeRouteSuggester;
