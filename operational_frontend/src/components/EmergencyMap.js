import React, { forwardRef, useEffect, useState } from 'react';
import { Alert, Platform, PermissionsAndroid, NativeModules, Linking, StyleSheet, View, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import PropTypes from 'prop-types';

const { RNAndroidOpenSettings } = NativeModules;

const DEFAULT_LOCATION = {
  latitude: 10.8505,
  longitude: 76.2711,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

const serviceIcons = {
  hospital: "hospital-building",
  police: "police-badge",
  ambulance: "ambulance",
  pharmacy: "pharmacy",
  firestation: "fire-truck"
};

const serviceColors = {
  hospital: "#E74C3C",
  police: "#3498DB",
  ambulance: "#E67E22",
  pharmacy: "#2ECC71",
  firestation: "#E74C3C"
};

const EmergencyMap = forwardRef(({
  onLocationChange,
  initialLocation = DEFAULT_LOCATION,
  mapPadding = { top: 80, right: 0, bottom: 0, left: 0 },
  nearbyServices = [],
  children,
  ...props
}, ref) => {
  const [location, setLocation] = useState(initialLocation);
  const [watchId, setWatchId] = useState(null);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      try {
        const auth = await Geolocation.requestAuthorization('whenInUse');
        return auth === 'granted';
      } catch (error) {
        console.error('iOS permission error:', error);
        return false;
      }
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "Emergency app needs access to your location",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Android permission error:', error);
      return false;
    }
  };

  const startLocationTracking = async (retryCount = 0) => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to use this app',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'android') {
                  RNAndroidOpenSettings.locationSourceSettings();
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return;
      }

      const id = Geolocation.watchPosition(
        position => {
          const { latitude, longitude } = position.coords;
          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setLocation(newRegion);
          onLocationChange?.(newRegion);
          ref.current?.animateToRegion(newRegion, 1000);
        },
        error => {
          console.error('Location error:', error);
          if (retryCount < MAX_RETRIES) {
            setTimeout(() => {
              startLocationTracking(retryCount + 1);
            }, RETRY_DELAY);
          } else {
            Alert.alert(
              'Location Error',
              'Failed to get your location. Please check your GPS settings.'
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 1000,
          distanceFilter: 10,
        }
      );
      setWatchId(id);
    } catch (error) {
      console.error('Location tracking error:', error);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          startLocationTracking(retryCount + 1);
        }, RETRY_DELAY);
      }
    }
  };

  useEffect(() => {
    startLocationTracking();
    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const renderServiceMarker = (service) => (
    <Marker
      key={service.id}
      coordinate={{
        latitude: service.location.latitude,
        longitude: service.location.longitude
      }}
      title={service.name}
      description={service.address}
    >
      <MaterialCommunityIcons
        name={serviceIcons[service.type] || 'map-marker'}
        size={30}
        color={serviceColors[service.type] || '#000'}
      />
      <Callout>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{service.name}</Text>
          <Text style={styles.calloutAddress}>{service.address}</Text>
          {service.phone && (
            <Text style={styles.calloutPhone}>{service.phone}</Text>
          )}
        </View>
      </Callout>
    </Marker>
  );

  return (
    <MapView
      ref={ref}
      provider={PROVIDER_GOOGLE}
      style={{ flex: 1 }}
      initialRegion={location}
      region={location}
      showsUserLocation={true}
      showsMyLocationButton={true}
      showsBuildings={true}
      showsTraffic={true}
      showsCompass={true}
      loadingEnabled={true}
      mapType="standard"
      followsUserLocation={true}
      mapPadding={mapPadding}
      {...props}
    >
      {nearbyServices.map(renderServiceMarker)}
      {children}
    </MapView>
  );
});

const styles = StyleSheet.create({
  callout: {
    padding: 10,
    maxWidth: 200,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  calloutAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  calloutPhone: {
    fontSize: 14,
    color: '#007AFF',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

EmergencyMap.displayName = 'EmergencyMap';

EmergencyMap.propTypes = {
  onLocationChange: PropTypes.func,
  initialLocation: PropTypes.shape({
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    latitudeDelta: PropTypes.number.isRequired,
    longitudeDelta: PropTypes.number.isRequired,
  }),
  children: PropTypes.node,
  mapPadding: PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number,
  }),
  nearbyServices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['hospital', 'police', 'ambulance', 'pharmacy', 'firestation']).isRequired,
      location: PropTypes.shape({
        latitude: PropTypes.number.isRequired,
        longitude: PropTypes.number.isRequired,
      }).isRequired,
      address: PropTypes.string,
      phone: PropTypes.string,
    })
  ),
};

export default EmergencyMap;