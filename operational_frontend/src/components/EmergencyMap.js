import React, { forwardRef } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const serviceIcons = {
  police: 'police-icon',
  fire: 'fire-icon',
  ambulance: 'ambulance-icon',
};

const serviceColors = {
  police: 'blue',
  fire: 'red',
  ambulance: 'green',
};

const EmergencyMap = forwardRef(({ 
  onLocationChange, 
  initialLocation, 
  mapPadding, 
  nearbyServices 
}, ref) => {
  return (
    <View style={styles.container}>
      <MapView
        ref={ref}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialLocation}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        onMapReady={() => {}}
        onRegionChange={onLocationChange}
        mapPadding={mapPadding}
      >
        {nearbyServices?.map((service, index) => (
          <Marker
            key={index}
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
          </Marker>
        ))}
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
  }
});

EmergencyMap.displayName = 'EmergencyMap';

export default EmergencyMap;