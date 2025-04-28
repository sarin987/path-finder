import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Header = ({ onMenuPress, onSearch }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onMenuPress}>
      <MaterialCommunityIcons name="menu" size={24} color="#007AFF" />
    </TouchableOpacity>
    <View style={styles.searchBar}>
      <MaterialCommunityIcons name="magnify" size={20} color="#666" />
      <TextInput 
        style={styles.searchInput}
        placeholder="Search location..."
        placeholderTextColor="#666"
        onChangeText={onSearch}
      />
    </View>
  </View>
);