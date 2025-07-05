import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Button, TouchableOpacity, Modal, TextInput as RNTextInput, ActivityIndicator, Platform } from 'react-native';
import { alert } from '../utils/alert';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import UserAvatar from '../components/dashboard/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import MapCard from '../components/dashboard/MapCard';
import Config from 'react-native-config';
import api from '../services/api';
import Geolocation from '@react-native-community/geolocation';
import { getPermissionsAndroid } from '../utils/platform';
import useUserLocation from '../hooks/useUserLocation';

function StarRating({ rating, setRating, disabled }) {
  return (
    <View style={{ flexDirection: 'row', marginVertical: 8 }}>
      {[1,2,3,4,5].map((star) => (
        <TouchableOpacity key={star} onPress={() => !disabled && setRating(star)} disabled={disabled}>
          <MaterialIcons name={star <= rating ? 'star' : 'star-border'} size={32} color={star <= rating ? '#FFD600' : '#B0BEC5'} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SafeRouteScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [destination, setDestination] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [avgRating, setAvgRating] = useState(null);
  const [route, setRoute] = useState(null);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const {
    showManualInput,
    setShowManualInput,
    setManualLocation,
  } = useUserLocation();
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const getLocation = () => {
    setLoading(true);
    setLocationError(null);
    // Check if Geolocation is available
    if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
      setLoading(false);
      setLocationError('Geolocation is not available on this device.');
      return;
    }
    // First try: high accuracy, short timeout
    Geolocation.getCurrentPosition(
      pos => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLoading(false);
      },
      err => {
        if (err.code === 3) { // TIMEOUT
          // Retry with lower accuracy and longer timeout
          Geolocation.getCurrentPosition(
            pos2 => {
              setUserLocation({
                latitude: pos2.coords.latitude,
                longitude: pos2.coords.longitude,
              });
              setLoading(false);
            },
            err2 => {
              // Try getLastKnownPosition if available
              if (Geolocation.getLastKnownPosition) {
                Geolocation.getLastKnownPosition(
                  pos3 => {
                    if (pos3) {
                      setUserLocation({
                        latitude: pos3.coords.latitude,
                        longitude: pos3.coords.longitude,
                      });
                      setLoading(false);
                    } else {
                      setLoading(false);
                      setLocationError('Unable to get your location. Please move to an open area or check your device settings.');
                    }
                  },
                  err3 => {
                    setLoading(false);
                    setLocationError('Unable to get your location. Please move to an open area or check your device settings.');
                  }
                );
              } else {
                setLoading(false);
                setLocationError('Unable to get your location. Please move to an open area or check your device settings.');
              }
            },
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
          );
        } else {
          setLoading(false);
          let errorMessage = 'Unable to get your location. Please ensure location is enabled and try again.';
          switch (err.code) {
            case 1:
              errorMessage = 'Location permission denied. Please enable location permissions in your device settings.';
              break;
            case 2:
              errorMessage = 'Location service unavailable. Please check if location services are enabled on your device.';
              break;
            case 3:
              errorMessage = 'Location request timed out. Please try again in an open area.';
              break;
            default:
              errorMessage = err?.message || errorMessage;
          }
          setLocationError(errorMessage);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  // Fetch location and reverse geocode for rating modal
  const fetchLocationAndPlace = useCallback(async () => {
    try {
      if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
        throw new Error('Geolocation is not available on this device.');
      }

      // Use the same improved location strategy
      const tryGetLocation = (options, attempt = 1) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`Location request timed out (attempt ${attempt})`));
          }, options.timeout || 10000);
          
          Geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeoutId);
              resolve(pos);
            },
            (err) => {
              clearTimeout(timeoutId);
              reject(err);
            },
            options
          );
        });
      };

      let position = null;
      let lastError = null;

      // Strategy 1: High accuracy with short timeout
      try {
        position = await tryGetLocation({
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 5000
        }, 1);
      } catch (error) {
        lastError = error;
      }

      // Strategy 2: Lower accuracy with longer timeout
      if (!position) {
        try {
          position = await tryGetLocation({
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 30000
          }, 2);
        } catch (error) {
          lastError = error;
        }
      }

      // Strategy 3: Try getLastKnownPosition as fallback
      if (!position && Geolocation.getLastKnownPosition) {
        try {
          position = await new Promise((resolve, reject) => {
            Geolocation.getLastKnownPosition(
              (pos) => {
                if (pos) {
                  resolve(pos);
                } else {
                  reject(new Error('No last known position available'));
                }
              },
              (err) => reject(err),
              { timeout: 5000 }
            );
          });
        } catch (error) {
          lastError = error;
        }
      }

      // If all strategies failed
      if (!position) {
        throw lastError || new Error('Unable to get location after multiple attempts');
      }

      const lat = Number(position.coords.latitude);
      const lng = Number(position.coords.longitude);
      
      if (typeof lat !== 'number' || !isFinite(lat) || typeof lng !== 'number' || !isFinite(lng)) {
        throw new Error('Invalid coordinates received from location service.');
      }

      setManualLocation(lat, lng);
      
      try {
        // Use environment variable for API key
        const googleMapsApiKey = Config.GOOGLE_MAPS_API_KEY;
        if (!googleMapsApiKey) {
          console.warn('Google Maps API key not found. Please add it to your .env file.');
          setPlaceName('Location services not configured');
          return { coords: { latitude: lat, longitude: lng }, place: 'Location services not configured' };
        }

        // Use the api service for external API calls to benefit from interceptors
        const response = await api.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`,
          { baseURL: '' } // Override baseURL to make a direct call to Google's API
        );
        
        const data = response.data;
        let address = 'Unknown location';
        
        if (data?.results?.[0]?.formatted_address) {
          address = data.results[0].formatted_address;
        } else if (data?.error_message) {
          console.warn('Google Maps Geocoding API error:', data.error_message);
        } else {
          console.warn('Google Maps Geocoding API unexpected response:', data);
        }
        
        setPlaceName(address);
        return { coords: { latitude: lat, longitude: lng }, place: address };
      } catch (err) {
        console.error('Reverse geocoding error:', err);
        setPlaceName('Location services unavailable');
        return { coords: { latitude: lat, longitude: lng }, place: 'Location services unavailable' };
      }
    } catch (error) {
      console.error('Location fetch error:', error);
      setPlaceName('Location services unavailable');
      throw error;
    }
  }, [setManualLocation]);

  // Open rating modal
  const openRatingModal = useCallback(async () => {
    try {
      await fetchLocationAndPlace();
      setShowRating(true);
    } catch (err) {
      alert('Location Error', 'Unable to get your location.');
    }
  }, [fetchLocationAndPlace]);

  // Submit rating
  const handleSubmitRating = useCallback(async () => {
    if (!rating) {
      alert('Rating Required', 'Please select a rating');
      return;
    }
    if (!userLocation.latitude || !userLocation.longitude) {
      alert('Location Error', 'Location not available. Please try again.');
      return;
    }
    if (!user?.id) {
      alert('Authentication Error', 'User not authenticated. Please log in again.');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/ratings', {
        userId: user.id,
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        placeName: placeName || 'Unknown location',
        rating,
        comment: comment || '',
        timestamp: new Date().toISOString()
      });
      
      if (userLocation) {
        setShowRating(false);
        setRating(0);
        setComment('');
        alert('Thank you!', 'Your safety rating has been submitted.');
      }
    } catch (err) {
      console.error('Rating submission error:', err);
      if (userLocation) {
        alert('Error', err.message || 'Failed to submit rating. Please try again.');
      }
    } finally {
      if (userLocation) {
        setSubmitting(false);
      }
    }
  }, [rating, userLocation, user, placeName, comment]);

  // Find route and fetch average rating
  const handleFindRoute = useCallback(async () => {
    if (!destination?.trim() || !userLocation) return;
    
    // Validate userLocation first
    if (!userLocation.latitude || !userLocation.longitude ||
        !isFinite(userLocation.latitude) || !isFinite(userLocation.longitude)) {
      alert('Location Error', 'Current location is not available. Please wait for location to load.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Validate destination format
      const destParts = destination.split(',').map(coord => coord.trim());
      if (destParts.length !== 2) {
        alert('Invalid Format', 'Please enter destination as "latitude,longitude"');
        return;
      }
      
      const [destLat, destLng] = destParts.map(Number);
      if (isNaN(destLat) || isNaN(destLng) || 
          Math.abs(destLat) > 90 || Math.abs(destLng) > 180) {
        alert('Invalid Coordinates', 'Please enter valid coordinates within valid ranges');
        return;
      }
      
      // Call backend to get safe route
      const response = await api.post('/routes/suggest', {
        start: { 
          lat: userLocation.latitude, 
          lng: userLocation.longitude 
        },
        end: { 
          lat: destLat, 
          lng: destLng 
        }
      });
      
      if (response.data?.route && userLocation) {
        setRoute(response.data.route);
        setRisks(response.data.risks || []);
        setAvgRating(response.data.averageRating || 0);
      }
    } catch (error) {
      console.error('Error finding route:', error);
      if (userLocation) {
        alert('Error', error.response?.data?.message || 'Failed to find safe route');
      }
    } finally {
      if (userLocation) {
        setLoading(false);
      }
    }
  }, [destination, userLocation]);

  // Handle manual location input
  const handleManualLocationSubmit = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) {
      alert('Invalid Input', 'Please enter valid numbers for latitude and longitude.');
      return;
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      alert('Invalid Coordinates', 'Latitude must be between -90 and 90, longitude between -180 and 180.');
      return;
    }
    setManualLocation(lat, lng);
    setManualLat('');
    setManualLng('');
  }, [manualLat, manualLng, setManualLocation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafd' }}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.openDrawer?.()} style={styles.menuButton}>
          <MaterialIcons name="menu" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Safe Route</Text>
        </View>
        <UserAvatar avatarUrl={user?.avatar} onPress={() => navigation.navigate('ChangeProfilePic')} />
      </View>
      {/* Content with top margin */}
      <View style={{ flex: 1, marginTop: 70, padding: 16 }}>
        <Text style={styles.header}>Find a Safe Route</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#128090" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : locationError ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={24} color="#d32f2f" />
            <Text style={styles.errorText}>{locationError}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Button title="Retry GPS" onPress={getLocation} />
              <Button title="Enter Manually" onPress={() => setShowManualInput(true)} color="#1976D2" />
            </View>
          </View>
        ) : (
          <>
            <TextInput
              style={[styles.input, { marginBottom: 16 }]}
              placeholder="Enter destination address"
              value={destination}
              onChangeText={setDestination}
              placeholderTextColor="#888"
            />
            <Button 
              title={loading ? "Finding Route..." : "Find Safe Route"} 
              onPress={handleFindRoute} 
              disabled={!destination.trim() || loading || !userLocation}
              color="#128090"
            />
          </>
        )}
        {avgRating && avgRating > 0 && (
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={{ fontWeight: 'bold', color: '#1976D2' }}>Destination Safety Rating:</Text>
            <StarRating rating={Math.round(avgRating)} setRating={()=>{}} disabled />
            <Text style={{ color: '#888' }}>{avgRating.toFixed(1)} / 5</Text>
          </View>
        )}
        <Button title="Rate This Location" color="#1976D2" onPress={openRatingModal} />
        <View style={{ flex: 1, marginVertical: 12 }}>
          {loading ? (
            <View style={styles.centered}><Text>Loading map...</Text></View>
          ) : locationError ? (
            <View style={styles.centered}>
              <Text style={{ color: 'red', marginBottom: 8 }}>{locationError}</Text>
              <Button title="Retry" onPress={getLocation} />
            </View>
          ) : !userLocation ? (
            <View style={styles.centered}><Text>Location not available.</Text></View>
          ) : !isFinite(userLocation.latitude) || !isFinite(userLocation.longitude) ? (
            <View style={styles.centered}><Text style={{ color: 'red' }}>Invalid coordinates</Text></View>
          ) : (
            <MapCard
              userLocation={userLocation}
              responders={[]}
              onRecenter={getLocation}
            />
          )}
        </View>
      </View>
      {/* Safety Rating Modal */}
      <Modal visible={showRating} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Rate Your Location</Text>
            <Text style={{ color: '#1976D2', marginBottom: 4 }}>{placeName}</Text>
            <StarRating rating={rating} setRating={setRating} />
            <RNTextInput
              style={styles.commentInput}
              placeholder="Why did you rate this way? (optional)"
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <Button title={submitting ? 'Submitting...' : 'Submit'} onPress={handleSubmitRating} disabled={submitting} />
            <Button title="Cancel" color="#888" onPress={()=>setShowRating(false)} />
          </View>
        </View>
      </Modal>

      {/* Manual Location Input Modal */}
      <Modal visible={showManualInput} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Enter Your Location</Text>
            <Text style={{ color: '#666', marginBottom: 16, textAlign: 'center' }}>
              Enter your latitude and longitude coordinates manually
            </Text>
            <RNTextInput
              style={styles.input}
              placeholder="Latitude (e.g., 40.7128)"
              value={manualLat}
              onChangeText={setManualLat}
              keyboardType="numeric"
            />
            <RNTextInput
              style={styles.input}
              placeholder="Longitude (e.g., -74.0060)"
              value={manualLng}
              onChangeText={setManualLng}
              keyboardType="numeric"
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Button title="Submit" onPress={handleManualLocationSubmit} />
              <Button title="Cancel" color="#888" onPress={() => setShowManualInput(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#128090', 
    paddingTop: Platform.OS === 'android' ? 18 : 40, 
    paddingBottom: 12, 
    paddingHorizontal: 18, 
    borderBottomLeftRadius: 18, 
    borderBottomRightRadius: 18, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  menuButton: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    backgroundColor: 'rgba(255,255,255,0.18)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 6, 
    elevation: 2, 
    marginRight: 10 
  },
  headerTitle: { 
    fontSize: 18, 
    color: '#e0f7fa', 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginVertical: 10,
  },
  header: { fontWeight: 'bold', fontSize: 20, marginBottom: 12, color: '#1976D2', alignSelf: 'center' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 8, marginBottom: 12, backgroundColor: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 320, alignItems: 'center', elevation: 4 },
  commentInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 8, minHeight: 60, width: 260, marginVertical: 12, backgroundColor: '#f8fafd' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

// ErrorBoundary component to catch all render errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.log('ErrorBoundary caught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafd' }}>
          <Text style={{ color: 'red', fontSize: 18 }}>Something went wrong: {this.state.error?.message || String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Patch: Add global error logging for all JS errors and unhandled rejections (React Native only)
if (typeof global !== 'undefined') {
  global.ErrorUtils = global.ErrorUtils || {};
  const origHandler = global.ErrorUtils.getGlobalHandler && global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.log('GLOBAL JS ERROR:', error, isFatal);
    if (origHandler) origHandler(error, isFatal);
  });
}

// At the end, export the screen wrapped in ErrorBoundary
function SafeRouteScreenWithBoundary(props) {
  return (
    <ErrorBoundary>
      <SafeRouteScreen {...props} />
    </ErrorBoundary>
  );
}

export default SafeRouteScreenWithBoundary;
