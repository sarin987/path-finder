import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SafeRouteSuggester = ({ userLocation }) => {
  const { user } = useAuth();
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState(null);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSuggestRoute = async () => {
    if (!userLocation || !destination) return;
    
    // Validate destination format
    const destParts = destination.split(',').map(coord => coord.trim());
    if (destParts.length !== 2) {
      Alert.alert('Invalid Format', 'Please enter destination as "latitude,longitude"');
      return;
    }
    
    const [destLat, destLng] = destParts.map(Number);
    if (isNaN(destLat) || isNaN(destLng)) {
      Alert.alert('Invalid Coordinates', 'Please enter valid numeric coordinates');
      return;
    }
    
    setLoading(true);
    setRoute(null);
    setRisks([]);
    
    try {
      const response = await api.post('/routes/suggest', {
        start: { 
          lat: userLocation.latitude, 
          lng: userLocation.longitude 
        },
        end: { 
          lat: destLat, 
          lng: destLng 
        }
      });
      
      if (response.data?.route) {
        setRoute(response.data.route);
        setRisks(response.data.risks || []);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Route suggestion error:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to get safe route. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
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
      <Text style={styles.label}>Enter destination coordinates:</Text>
      <Text style={styles.hint}>Format: latitude,longitude (e.g. 12.9716,77.5946)</Text>
      <TextInput
        style={styles.input}
        value={destination}
        onChangeText={setDestination}
        placeholder="e.g. 12.9716,77.5946"
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#999"
      />
      <View style={styles.buttonContainer}>
        <Button 
          title={loading ? 'Finding Safe Route...' : 'Suggest Safe Route'} 
          onPress={handleSuggestRoute} 
          disabled={loading || !destination.trim()}
          color="#128090"
        />
      </View>
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
  container: { 
    flex: 1, 
    padding: 16,
    backgroundColor: '#f8fafd',
  },
  header: { 
    fontWeight: 'bold', 
    fontSize: 18, 
    marginBottom: 16,
    color: '#1976D2',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    color: '#374151',
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: { 
    width: '100%', 
    height: 300, 
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  errorText: {
    color: '#dc2626',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SafeRouteSuggester;
