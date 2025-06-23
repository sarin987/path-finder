
import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { getResponderIcon } from './utils';

const MapViewComponent = React.forwardRef(({
  region,
  onRegionChangeComplete,
  userLocation,
  responders = [],
  onMarkerPress = () => {},
  onMapReady = () => {},
  children,
}, ref) => {
  return (
    <View style={styles.container}>
      <MapView
        ref={ref}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        onMapReady={onMapReady}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        loadingEnabled={true}
        loadingIndicatorColor="#666666"
        loadingBackgroundColor="#eeeeee"
      >
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude || 0,
              longitude: userLocation.longitude || 0,
            }}
            title="Your Location"
            pinColor="#4285F4"
            tracksViewChanges={false}
          />
        )}
        
        {Array.isArray(responders) && responders.map((responder) => {
          // Skip if responder data is incomplete
          if (!responder || 
              typeof responder.latitude !== 'number' || 
              typeof responder.longitude !== 'number' ||
              !responder.id) {
            console.warn('Skipping invalid responder data:', responder);
            return null;
          }
          
          const iconSource = getResponderIcon(responder.role);
          
          return (
            <Marker
              key={`${responder.id}-${responder.latitude},${responder.longitude}`}
              coordinate={{
                latitude: responder.latitude,
                longitude: responder.longitude,
              }}
              title={responder.name || 'Responder'}
              description={responder.role ? `${responder.role}${responder.status ? ` - ${responder.status}` : ''}` : 'Responder'}
              onPress={() => onMarkerPress(responder)}
              tracksViewChanges={false}
            >
              {iconSource && (
                <View style={styles.markerContainer}>
                  <Image
                    source={iconSource}
                    style={styles.markerImage}
                    resizeMode="contain"
                    onError={(e) => console.warn('Failed to load marker icon:', e.nativeEvent.error)}
                  />
                </View>
              )}
            </Marker>
          );
        })}
        
        {children}
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
