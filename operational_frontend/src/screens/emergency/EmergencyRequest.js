import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { alert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import { useAuth } from '../../contexts/AuthContext';

const EmergencyRequest = ({ route, navigation }) => {
  const { type } = route.params;
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    try {
      Geolocation.requestAuthorization();

      Geolocation.getCurrentPosition(
        position => {
          setLocation(position);
        },
        error => {
          console.error(error);
          alert('Error', 'Failed to get location. Please enable location services.');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      console.error(error);
      alert('Error', 'Failed to get location');
    }
  };

  const handleEmergencyRequest = async () => {
    if (!location) {
      alert('Error', 'Location is required. Please enable location services.');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call to send emergency request
      const response = await fetch('YOUR_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          type,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          description,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send emergency request');
      }

      Alert.alert(
        'Success',
        'Emergency request sent successfully. Help is on the way!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      alert('Error', 'Failed to send emergency request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getEmergencyTypeInfo = () => {
    switch (type) {
      case 'medical':
        return {
          title: 'Medical Emergency',
          icon: 'ambulance',
          color: '#FF4B4B',
        };
      case 'police':
        return {
          title: 'Police Emergency',
          icon: 'police-badge',
          color: '#4B7BFF',
        };
      case 'fire':
        return {
          title: 'Fire Emergency',
          icon: 'fire',
          color: '#FF784B',
        };
      default:
        return {
          title: 'Emergency',
          icon: 'alert',
          color: '#FF4B4B',
        };
    }
  };

  const emergencyInfo = getEmergencyTypeInfo();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{emergencyInfo.title}</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.emergencyIcon, { backgroundColor: emergencyInfo.color }]}>
          <Icon name={emergencyInfo.icon} size={48} color="white" />
        </View>

        <Text style={styles.label}>Your Location</Text>
        <View style={styles.locationContainer}>
          {location ? (
            <Text style={styles.locationText}>
              {`Latitude: ${location.coords.latitude.toFixed(6)}\nLongitude: ${location.coords.longitude.toFixed(6)}`}
            </Text>
          ) : (
            <Text style={styles.locationText}>Getting location...</Text>
          )}
          <TouchableOpacity style={styles.refreshButton} onPress={getLocation}>
            <Icon name="refresh" size={24} color="#4B7BFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Describe your emergency..."
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: emergencyInfo.color }]}
          onPress={handleEmergencyRequest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Icon name="send" size={24} color="white" />
              <Text style={styles.submitButtonText}>Send Emergency Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    elevation: 2,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  emergencyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  locationContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    padding: 5,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    textAlignVertical: 'top',
    minHeight: 100,
    elevation: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default EmergencyRequest;
