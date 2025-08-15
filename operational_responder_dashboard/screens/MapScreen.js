import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Sidebar from '../components/Sidebar';

// Simple map component that shows a placeholder
const SimpleMap = () => (
  <View style={styles.mapContainer}>
    <Text style={styles.mapPlaceholder}>Map View</Text>
    <Text style={styles.mapNote}>Map functionality will be implemented here</Text>
  </View>
);

const MapScreen = () => {
  const navigation = useNavigation();
  const { width } = Dimensions.get('window');
  const isMobile = width < 600;
  
  const SIDEBAR_WIDTH = 80;
  const activeScreen = 'map';
  
  const sidebarItems = [
    { label: 'Dashboard', icon: 'Dashboard', screen: 'dashboard' },
    { label: 'Incident', icon: 'ReportProblem', screen: 'incident' },
    { label: 'Live Map', icon: 'Map', screen: 'map' },
    { label: 'Media', icon: 'PhotoCamera', screen: 'media' },
    { label: 'History', icon: 'Assessment', screen: 'history' },
    { label: 'Settings', icon: 'Settings', screen: 'settings' },
  ];

  // TODO: Replace with your API implementation
  const fetchMapData = async () => {
    try {
      // Example API call:
      // const response = await fetch('YOUR_API_ENDPOINT/map-data');
      // const data = await response.json();
      // return data;
      return [];
    } catch (error) {
      console.error('Error fetching map data:', error);
      return [];
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchMapData();
      // Process data as needed
    };
    loadData();
  }, []);

  return (
    <View style={[styles.container, !isMobile && { flexDirection: 'row' }]}>
      {isMobile ? (
        <View style={styles.content}>
          <SimpleMap />
        </View>
      ) : (
        <>
          <Sidebar 
            items={sidebarItems} 
            activeScreen={activeScreen} 
            style={styles.sidebar} 
          />
          <View style={styles.content}>
            <Text style={styles.title}>Live Map</Text>
            <SimpleMap />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sidebar: {
    width: 80,
    backgroundColor: '#f8f9fa',
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginTop: 10,
  },
  mapPlaceholder: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  mapNote: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default MapScreen;
