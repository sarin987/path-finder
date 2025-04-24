// components/SmartEmergencyButton.js
import React, { useState, useEffect } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  View, 
  StyleSheet, 
  ActivityIndicator,
  Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { emergencyTypes } from '../services/emergencyService';
import { db } from '../config/firebase';

const SmartEmergencyButton = ({ 
  userId, 
  userDisplayName,
  serviceType,
  onEmergencyRaised,
  style,
  buttonStyle,
  textStyle,
  iconSize = 24,
  buttonText = 'Emergency'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const raiseEmergency = async (type) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      });

      // Create emergency request
      const emergencyData = {
        userId,
        userDisplayName,
        type,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        },
        timestamp: new Date().toISOString(),
        priority: emergencyTypes[type] || emergencyTypes.MEDIUM
      };

      // Store in database
      await addDoc(collection(db, 'emergency_requests'), emergencyData);

      // Notify nearby services
      const services = await getDocs(collection(db, 'emergency_services'));
      services.docs.forEach(service => {
        addDoc(collection(db, 'emergency_notifications'), {
          serviceId: service.id,
          emergencyId: emergencyData.id,
          status: 'pending',
          timestamp: new Date().toISOString()
        });
      });

      if (onEmergencyRaised) {
        onEmergencyRaised(emergencyData);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error raising emergency:', error);
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
        onPress={() => raiseEmergency(serviceType)}
        disabled={isLoading}
      >
        <Ionicons 
          name="alert-circle-sharp" 
          size={iconSize} 
          color={isLoading ? '#ccc' : '#fff'}
        />
        <Text style={[styles.buttonText, textStyle, isLoading && styles.disabledText]}>
          {isLoading ? 'Processing...' : buttonText}
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
    alignItems: 'center',
    justifyContent: 'center'
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  disabledText: {
    color: '#ccc'
  },
  errorText: {
    color: '#D32F2F',
    marginTop: 10
  }
});

export default SmartEmergencyButton;    