import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadImageAsync } from '../services/firebaseUpload';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ChangeProfilePic = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.8,
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          setError(response.errorMessage || 'Could not pick image');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          setImage(response.assets[0].uri);
          setError('');
        }
      }
    );
  };

  const uploadAndSave = async () => {
    if (!image || !user) return;
    setUploading(true);
    setError('');
    setSuccess(false);
    try {
      console.log('[ChangeProfilePic] Starting upload for user:', user);
      // Upload to Firebase in user folder
      const userFolder = user.username || user.email || user.id || 'unknown_user';
      const firebasePath = `users/${userFolder}/profile.jpg`;
      console.log('[ChangeProfilePic] Uploading to Firebase path:', firebasePath);
      const url = await uploadImageAsync(image, firebasePath);
      console.log('[ChangeProfilePic] Firebase upload complete. URL:', url);
      setUploading(false);
      setSaving(true);
      // Save to backend
      console.log('[ChangeProfilePic] Sending avatar URL to backend:', url, 'Base URL:', api.defaults.baseURL);
      await api.post('/users/profile-photo-url', { avatarUrl: url });
      console.log('[ChangeProfilePic] Backend update complete.');
      // Update user context with new avatar
      if (typeof updateUser === 'function') {
        await updateUser({ avatar: url });
      }
      setSaving(false);
      setSuccess(true);
      Alert.alert('Success', 'Profile picture updated!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      setUploading(false);
      setSaving(false);
      console.log('[ChangeProfilePic] Error:', err);
      setError(err.message || 'Failed to upload or save profile picture');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Profile Picture</Text>
      {image ? (
        <Image source={{ uri: image }} style={styles.avatar} />
      ) : user?.avatar ? (
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }]}> 
          <Text style={{ color: '#888' }}>No Image</Text>
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={pickImage} disabled={uploading || saving}>
        <Text style={styles.buttonText}>Pick an Image</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, (!image || uploading || saving) && { backgroundColor: '#ccc' }]}
        onPress={uploadAndSave}
        disabled={!image || uploading || saving}
      >
        {uploading || saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save as Profile Picture</Text>
        )}
      </TouchableOpacity>
      <Button title="Go Back" onPress={() => navigation.goBack()} color="#888" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    backgroundColor: '#eee',
  },
  button: {
    backgroundColor: '#128090',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    marginVertical: 10,
    alignItems: 'center',
    minWidth: 180,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});

export default ChangeProfilePic;
