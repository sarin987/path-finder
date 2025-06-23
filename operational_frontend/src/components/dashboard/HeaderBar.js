import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const HeaderBar = ({ user, onSettings }) => (
  <View style={styles.container}>
    <View style={styles.left}>
      <Image source={{ uri: user?.avatarUrl }} style={styles.avatar} />
      <Text style={styles.greeting}>Hi, {user?.name || 'User'}!</Text>
    </View>
    <TouchableOpacity onPress={onSettings}>
      <MaterialIcons name="settings" size={28} color="#1976D2" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  left: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#eee' },
  greeting: { fontSize: 18, fontWeight: 'bold', color: '#222' },
});

export default HeaderBar;
