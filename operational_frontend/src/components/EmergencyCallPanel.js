import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';
import { api } from '../config/network';

// For demo: Replace with real video/voice call integration (e.g., Twilio, WebRTC)
const EmergencyCallPanel = ({ userId }) => {
  const [calling, setCalling] = useState(false);
  const [callType, setCallType] = useState(null);
  const [callId, setCallId] = useState(null);
  const [error, setError] = useState(null);

  const initiateCall = async (type) => {
    setCalling(true);
    setCallType(type);
    setError(null);
    let location = { lat: null, lng: null };
    Geolocation.getCurrentPosition(
      (pos) => {
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        sendCallRequest(type, location);
      },
      (error) => {
        sendCallRequest(type, location);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );
  };

  const sendCallRequest = async (type, location) => {
    try {

      const response = await api.post('/emergency/initiate', {
        user_id: userId,
        call_type: type,
        location_lat: location.lat,
        location_lng: location.lng,
      });
      setCallId(response.data.call_id);
    } catch (e) {
      setError('Failed to initiate call');
    }
    setCalling(false);
  };

  const endCall = async () => {
    setCalling(true);
    setError(null);
    try {
      await axios.post(`${BACKEND_IP}/api/call/end`, { call_id: callId });
      setCallId(null);
      setCallType(null);
    } catch (e) {
      setError('Failed to end call');
    }
    setCalling(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Emergency Call</Text>
      {!callId ? (
        <>
          <Button title="Start Voice Call" onPress={() => initiateCall('voice')} disabled={calling} />
          <View style={{ height: 8 }} />
          <Button title="Start Video Call" onPress={() => initiateCall('video')} disabled={calling} />
        </>
      ) : (
        <>
          <Text style={{ marginVertical: 8 }}>Call in progress ({callType})</Text>
          <Button title="End Call" onPress={endCall} disabled={calling} color="red" />
        </>
      )}
      {calling && <ActivityIndicator style={{ marginTop: 8 }} />}
      {error && <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
});

export default EmergencyCallPanel;
