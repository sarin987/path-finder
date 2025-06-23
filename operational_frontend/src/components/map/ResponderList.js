import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { getResponderIcon } from './utils';

const ResponderItem = ({ responder, onPress }) => {
  return (
    <TouchableOpacity style={styles.responderItem} onPress={() => onPress(responder)}>
      <View style={styles.avatarContainer}>
        <Image 
          source={getResponderIcon(responder.role)} 
          style={styles.avatar} 
          resizeMode="contain"
        />
      </View>
      <View style={styles.responderInfo}>
        <Text style={styles.responderName} numberOfLines={1}>
          {responder.name}
        </Text>
        <Text style={styles.responderRole}>
          {responder.role.charAt(0).toUpperCase() + responder.role.slice(1)}
        </Text>
        <Text style={styles.responderStatus}>
          {responder.status}
        </Text>
      </View>
      <View style={styles.distanceContainer}>
        <Text style={styles.distanceText}>
          {responder.distance ? `${responder.distance.toFixed(1)} km` : '--'}
        </Text>
        {responder.eta && (
          <Text style={styles.etaText}>ETA: {responder.eta}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const ResponderList = ({ responders, onResponderPress, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.header}>Nearby Responders</Text>
      <FlatList
        data={responders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ResponderItem responder={item} onPress={onResponderPress} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  listContent: {
    paddingBottom: 8,
  },
  responderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
  },
  responderInfo: {
    flex: 1,
    marginRight: 8,
  },
  responderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  responderRole: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  responderStatus: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
  },
  distanceContainer: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 2,
  },
  etaText: {
    fontSize: 11,
    color: '#666',
  },
});

export default React.memo(ResponderList);
