import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import axios from 'axios';

const RiskPredictionMap = ({ userLocation }) => {
  const [risks, setRisks] = useState([]);

  useEffect(() => {
    if (!userLocation) return;
    const fetchRisks = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/predictions/risks', {
          params: { lat: userLocation.latitude, lng: userLocation.longitude }
        });
        setRisks(res.data);
      } catch (e) {
        // ignore
      }
    };
    fetchRisks();
  }, [userLocation]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || 20.5937,
          longitude: userLocation?.longitude || 78.9629,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
      >
        {risks.map((risk, idx) => (
          <Marker
            key={idx}
            coordinate={{ latitude: risk.lat, longitude: risk.lng }}
            pinColor={risk.risk_level === 'high' ? 'red' : risk.risk_level === 'medium' ? 'orange' : 'yellow'}
          >
            <Callout>
              <Text>Risk: {risk.risk_type}</Text>
              <Text>Level: {risk.risk_level}</Text>
              <Text>{risk.description}</Text>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.3 },
});

export default RiskPredictionMap;
