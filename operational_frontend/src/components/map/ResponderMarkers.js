import React, { memo } from 'react';
import { Marker } from 'react-native-maps';
import { View, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const roleIcons = {
  police: 'security',
  ambulance: 'local-hospital',
  fire: 'local-fire-department',
  default: 'location-on',
};

const roleColors = {
  police: '#3F51B5', // Blue
  ambulance: '#E91E63', // Pink
  fire: '#F44336', // Red
  default: '#4CAF50', // Green
};

const ResponderMarkers = ({ responders, onPress }) => {
  return (
    <>
      {responders.map((responder) => {
        // Skip if location data is missing
        if (!responder.latitude || !responder.longitude) {return null;}

        return (
          <Marker
            key={responder.id}
            coordinate={{
              latitude: responder.latitude,
              longitude: responder.longitude,
            }}
            onPress={() => onPress && onPress(responder)}
            title={`${responder.role || 'Responder'}`}
            description={`Last seen: ${responder.lastSeen?.toLocaleTimeString() || 'Unknown'}`}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.markerBackground,
                  { backgroundColor: roleColors[responder.role] || roleColors.default },
                ]}
              >
                <MaterialIcons
                  name={roleIcons[responder.role] || roleIcons.default}
                  size={20}
                  color="white"
                />
              </View>
              {responder.distance !== undefined && (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>
                    {responder.distance < 1
                      ? `${Math.round(responder.distance * 1000)}m`
                      : `${responder.distance.toFixed(1)}km`}
                  </Text>
                </View>
              )}
            </View>
          </Marker>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  markerBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: -5,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  distanceText: {
    fontSize: 10,
    color: '#333',
    fontWeight: 'bold',
  },
});

export default memo(ResponderMarkers, (prevProps, nextProps) => {
  // Only re-render if responders array changes
  if (prevProps.responders.length !== nextProps.responders.length) {return false;}

  // Check if any responder's location has changed
  return !nextProps.responders.some((responder, index) => {
    const prevResponder = prevProps.responders[index];
    return (
      !prevResponder ||
      responder.latitude !== prevResponder.latitude ||
      responder.longitude !== prevResponder.longitude
    );
  });
});
