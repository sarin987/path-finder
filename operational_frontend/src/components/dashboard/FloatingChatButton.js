import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const FloatingChatButton = ({ onPress, unreadCount }) => (
  <TouchableOpacity style={styles.fab} onPress={onPress}>
    <MaterialIcons name="chat" size={28} color="#fff" />
    {unreadCount > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{unreadCount}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: { position: 'absolute', bottom: 32, right: 24, backgroundColor: '#1976D2', borderRadius: 28, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  badge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#E53935', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});

export default FloatingChatButton;
