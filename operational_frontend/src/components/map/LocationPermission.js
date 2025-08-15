import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const LocationPermission = ({ onRequestPermission, onDismiss }) => {
  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {onDismiss();}
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialIcons name="location-off" size={48} color="#FF6B6B" style={styles.icon} />
        <Text style={styles.title}>Location Access Required</Text>
        <Text style={styles.message}>
          To see nearby responders and get accurate assistance, please enable location access in your device settings.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleDismiss}
          >
            <Text style={[styles.buttonText, styles.cancelButtonText]}>Not Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.settingsButton]}
            onPress={handleOpenSettings}
          >
            <Text style={[styles.buttonText, styles.settingsButtonText]}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  settingsButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#555',
  },
  settingsButtonText: {
    color: 'white',
  },
});

export default LocationPermission;
