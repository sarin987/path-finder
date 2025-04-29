import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';

const IncidentReportForm = ({ onReportSuccess }) => {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.7,
    };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        alert('ImagePicker Error: ' + response.errorMessage);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setPhoto(response.assets[0].uri);
      }
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    Geolocation.getCurrentPosition(
      async (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        await submitIncident(loc);
      },
      async (error) => {
        // Proceed without location if permission denied
        await submitIncident(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );
  };

  const submitIncident = async (location) => {
    try {
      const formData = new FormData();
      formData.append('user_id', 1); // Replace with real user ID from auth context
      formData.append('type', type);
      formData.append('description', description);
      if (photo) {
        formData.append('photo', {
          uri: photo,
          type: 'image/jpeg',
          name: 'incident.jpg',
        });
      }
      if (location) {
        formData.append('location_lat', location.lat);
        formData.append('location_lng', location.lng);
      }
      await axios.post('http://localhost:5000/api/incidents/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setType(''); setDescription(''); setPhoto(null); setLocation(null);
      onReportSuccess && onReportSuccess();
    } catch (e) {
      alert('Failed to report incident');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Incident Type</Text>
      <TextInput value={type} onChangeText={setType} style={styles.input} placeholder="e.g. Accident, Crime" />
      <Text style={styles.label}>Description</Text>
      <TextInput value={description} onChangeText={setDescription} style={styles.input} multiline numberOfLines={3} placeholder="Describe the incident..." />
      <Button title="Pick Photo" onPress={pickImage} />
      {photo && <Image source={{ uri: photo }} style={styles.image} />}
      <Button title={loading ? "Reporting..." : "Report Incident"} onPress={handleSubmit} disabled={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontWeight: 'bold', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginVertical: 4 },
  image: { width: 100, height: 100, marginVertical: 8 },
});

export default IncidentReportForm;
