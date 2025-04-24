import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useLocation } from '../../hooks/useLocation';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../config/constants';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { location } = useLocation();
  const { user } = useAuth();

  const fetchServices = async () => {
    try {
      if (!location) return;

      const response = await fetch(
        `${API_ROUTES.base}/api/services/nearby?latitude=${location.latitude}&longitude=${location.longitude}`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch services');
      
      setServices(data.services);
    } catch (err) {
      console.error('Fetch services error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      fetchServices();
    }
  }, [location]);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text style={{ color: 'red' }}>{error}</Text>;

  return (
    <FlatList
      data={services}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.serviceItem}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text>{item.distance.toFixed(2)} km away</Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  serviceItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Services;