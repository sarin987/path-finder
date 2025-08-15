import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  View, 
  StyleSheet, 
  ActivityIndicator,
  Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { 
  collection, 
  addDoc, 
  doc,
  updateDoc

const LocationShareButton = ({
  userId,
  userDisplayName,
  serviceType,
  emergencyProfile,
  onLocationShared,
  apiEndpoint = 'YOUR_API_ENDPOINT',
  style,
  buttonStyle,
  textStyle,
  iconSize = 24,
  buttonText = 'Share Location'
}) => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const shareLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current location with retry logic
      const maxRetries = 3;
      let retryCount = 0;
      let position = null;
      let locationError = null;

      while (retryCount < maxRetries && !position) {
        try {
          position = await new Promise((resolve, reject) => {
            // Clear any previous timeout
            let timeoutId;
            
            const watchId = navigator.geolocation.getCurrentPosition(
              (pos) => {
                clearTimeout(timeoutId);
                resolve(pos);
              },
              (err) => {
                clearTimeout(timeoutId);
                reject(err);
              },
              { 
                enableHighAccuracy: true, 
                timeout: 20000,  // Increased timeout to 20 seconds
                maximumAge: 0     // Force fresh location
              }
            );

            // Set a timeout to clear the watch if it takes too long
            timeoutId = setTimeout(() => {
              navigator.geolocation.clearWatch(watchId);
              reject({ code: 3, message: 'Location request timed out' });
            }, 20000);
          });
        } catch (err) {
          locationError = err;
          retryCount++;
          if (retryCount < maxRetries) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (!position) {
        throw locationError || new Error('Failed to get location after multiple attempts');
      }

      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      };

      console.log('Location data:', locationData);

      // Store in database
      await addDoc(collection(db, 'user_locations'), {
        userId,
        displayName: userDisplayName,
        location: locationData,
        serviceType,
        timestamp: locationData.timestamp
      });

      // Send to API
      if (apiEndpoint) {
        await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            location: locationData,
            timestamp: locationData.timestamp
          })
        });
      }

      // Create chat message
      await addDoc(collection(db, 'messages'), {
        text: 'Location shared',
        senderId: userId,
        senderName: userDisplayName,
        timestamp: locationData.timestamp,
        type: 'location',
        serviceType,
        emergencyProfile,
        location: locationData,
        isRead: false
      });

      if (onLocationShared) {
        onLocationShared(locationData);
      }

      setLocation(locationData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sharing location:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          buttonStyle,
          isLoading && styles.disabledButton
        ]}
        onPress={shareLocation}
        disabled={isLoading}
      >
        <Ionicons 
          name="location-sharp" 
          size={iconSize} 
          color={isLoading ? '#ccc' : '#fff'}
        />
        <Text style={[styles.buttonText, textStyle, isLoading && styles.disabledText]}>
          {isLoading ? 'Sharing...' : buttonText}
        </Text>
        {isLoading && <ActivityIndicator size="small" color="#fff" />}
      </TouchableOpacity>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledText: {
    color: '#666',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default LocationShareButton;