import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { startLocationTracking, stopLocationTracking } from '../../services/responderLocationService';
import { getAuth } from 'firebase/auth';

const ResponderStatus = ({ role = 'responder' }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Not sharing');
  const auth = getAuth();

  // Toggle online/offline status
  const toggleStatus = async () => {
    if (isOnline) {
      // Going offline
      try {
        setIsLoading(true);
        await stopLocationTracking();
        setIsOnline(false);
        setLocationStatus('Not sharing');
        setError(null);
      } catch (err) {
        console.error('Error stopping location tracking:', err);
        setError('Failed to go offline. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Going online
      try {
        setIsLoading(true);
        await startLocationTracking(role);
        setIsOnline(true);
        setLocationStatus('Sharing location...');
        setError(null);
      } catch (err) {
        console.error('Error starting location tracking:', err);
        setError('Failed to go online. Please check your location settings.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Update location status when online
  useEffect(() => {
    if (!isOnline) return;

    // Simulate location updates
    const interval = setInterval(() => {
      setLocationStatus(`Last updated: ${new Date().toLocaleTimeString()}`);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline]);

  // Check initial status when component mounts
  useEffect(() => {
    const checkStatus = async () => {
      // In a real app, you would check the Firestore document
      // to see if the responder is already online
      // For now, we'll default to offline
      setIsOnline(false);
    };

    checkStatus();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View style={styles.statusIndicatorContainer}>
          <View 
            style={[
              styles.statusIndicator, 
              isOnline ? styles.statusOnline : styles.statusOffline
            ]} 
          />
          <Text style={styles.statusText}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
        
        <Text style={styles.roleText}>
          {role.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.locationStatus}>
        {locationStatus}
      </Text>

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      <TouchableOpacity 
        style={[
          styles.toggleButton,
          isOnline ? styles.toggleButtonOffline : styles.toggleButtonOnline
        ]}
        onPress={toggleStatus}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <MaterialIcons 
              name={isOnline ? 'location-off' : 'location-on'} 
              size={20} 
              color="#fff" 
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>
              {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {isOnline && (
        <View style={styles.noteContainer}>
          <MaterialIcons name="info" size={16} color="#666" />
          <Text style={styles.noteText}>
            Your location is being shared with emergency responders.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusOnline: {
    backgroundColor: '#4CAF50',
  },
  statusOffline: {
    backgroundColor: '#9E9E9E',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  locationStatus: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#F44336',
    marginBottom: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  toggleButtonOnline: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonOffline: {
    backgroundColor: '#F44336',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
});

export default ResponderStatus;
