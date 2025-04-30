import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import { API_ROUTES } from '../config';
import { useAuth } from '../contexts/AuthContext';

const IncidentReportForm = ({ recipient, onReportSuccess, onSubmit, onCancel }) => {
  const { user } = useAuth();
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
        await submitIncident(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );
  };

  const submitIncident = async (location) => {
    try {
      const formData = new FormData();
      formData.append('user_id', user?.id || 1);
      formData.append('recipient', recipient);
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
      await axios.post(`${API_ROUTES.base}/api/incidents/report`, formData, {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={styles.container}>
          <Text style={styles.label}>Incident Type</Text>
          <TextInput
            value={type}
            onChangeText={setType}
            style={styles.input}
            placeholder="e.g. Accident, Crime"
            placeholderTextColor="#888"
          />
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={3}
            placeholder="Describe the incident..."
            placeholderTextColor="#888"
          />
          <Button title="Pick Photo" onPress={pickImage} />
          {photo && <Image source={{ uri: photo }} style={styles.image} />}
          <Button title={loading ? "Reporting..." : "Report Incident"} onPress={handleSubmit} disabled={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', borderRadius: 12, margin: 8 },
  label: { fontWeight: 'bold', marginTop: 8, fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#b0b0b0',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#222',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  image: { width: 120, height: 120, marginVertical: 8, borderRadius: 8, alignSelf: 'center' },
});

export default IncidentReportForm;
