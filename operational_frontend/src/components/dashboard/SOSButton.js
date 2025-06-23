import React from 'react';
import { TouchableOpacity, Animated, StyleSheet, Text } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const SOSButton = ({ onPress, animValue, small }) => (
  <Animated.View style={[styles.container, { transform: [{ scale: animValue || 1 }] }] }>
    <TouchableOpacity style={[styles.button, small && styles.buttonSmall]} onPress={onPress} activeOpacity={0.85}>
      <MaterialIcons name="warning" size={small ? 32 : 48} color="#fff" />
      <Text style={[styles.label, small && styles.labelSmall]}>SOS</Text>
    </TouchableOpacity>
  </Animated.View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  button: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#E53935', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  buttonSmall: { width: 60, height: 60, borderRadius: 30 },
  label: { color: '#fff', fontWeight: 'bold', fontSize: 22, marginTop: 6 },
  labelSmall: { fontSize: 14, marginTop: 2 },
});

export default SOSButton;
