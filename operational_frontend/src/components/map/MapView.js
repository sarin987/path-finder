import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Circle } from 'react-native-maps';
import { useFirestoreResponders } from '../../hooks/useFirestoreResponders';
import ResponderMarkers from './ResponderMarkers';

const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MapViewComponent = React.forwardRef(({
  region: propRegion,
  onRegionChangeComplete,
  userLocation,
  responders: propResponders,
  showNearbyResponders = true,
  searchRadius = 10, // in kilometers
  onMarkerPress = () => {},
  onMapReady = () => {},
  onRespondersUpdate = () => {},
  children,
}, ref) => {
  const mapRef = useRef(null);
  const initialRegion = useRef(propRegion || (userLocation ? {
    ...userLocation,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  } : null));

  // Use Firestore responders if not provided via props
  const { responders: firestoreResponders } = useFirestoreResponders(
    userLocation || initialRegion.current,
    searchRadius,
    ['police', 'ambulance', 'fire']
  );

  const responders = propResponders || firestoreResponders;
  
  // Notify parent when responders update
  useEffect(() => {
    if (onRespondersUpdate) {
      onRespondersUpdate(responders);
    }
  }, [responders, onRespondersUpdate]);

  // Handle map reference
  const handleMapReady = () => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(mapRef.current);
      } else {
        ref.current = mapRef.current;
      }
    }
    onMapReady();
  };
  return (
    <View style={[styles.container, StyleSheet.absoluteFillObject]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion.current}
        onRegionChangeComplete={onRegionChangeComplete}
        onMapReady={handleMapReady}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={true}
        showsCompass={true}
        loadingEnabled={true}
        loadingIndicatorColor="#666666"
        loadingBackgroundColor="#eeeeee"
        mapType="standard"
        toolbarEnabled={true}
        moveOnMarkerPress={true}
        pitchEnabled={true}
        rotateEnabled={true}
        scrollDuringRotateOrZoomEnabled={true}
        zoomControlEnabled={true}
        zoomTapEnabled={true}
        zoomEnabled={true}
        minZoomLevel={5}
        maxZoomLevel={20}
      >
        {/* User location marker */}
        {userLocation && (
          <>
            <Circle
              center={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              radius={searchRadius * 1000} // Convert km to meters
              fillColor="rgba(66, 133, 244, 0.1)"
              strokeColor="rgba(66, 133, 244, 0.5)"
              strokeWidth={1}
            />
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title="Your Location"
              description="Your current location"
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.userLocation}>
                <View style={styles.userLocationPulse} />
                <View style={styles.userLocationInner} />
              </View>
            </Marker>
          </>
        )}
        
        {/* Responder markers */}
        {showNearbyResponders && Array.isArray(responders) && (
          <ResponderMarkers 
            responders={responders} 
            onPress={onMarkerPress} 
          />
        )}
        
        {children}
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  userLocation: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(66, 133, 244, 0.9)',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  userLocationPulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: 'rgba(66, 133, 244, 0.3)',
    transform: [{ scale: 2 }],
  },
  searchRadius: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  searchRadiusText: {
    fontWeight: 'bold',
    color: '#333',
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  markerImage: {
    width: 30,
    height: 30,
  },
});

MapViewComponent.displayName = 'MapViewComponent';

export default React.memo(MapViewComponent);
