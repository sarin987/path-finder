// Type definitions for react-native-maps
// Project: https://github.com/react-native-maps/react-native-maps

declare module 'react-native-maps' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }

  export interface LatLng {
    latitude: number;
    longitude: number;
  }

  export interface MapViewProps extends ViewProps {
    initialRegion?: Region;
    region?: Region;
    onRegionChange?: (region: Region) => void;
    onRegionChangeComplete?: (region: Region) => void;
    style?: any;
    // Add other MapView props as needed
  }

  export interface MarkerProps {
    coordinate: LatLng;
    title?: string;
    description?: string;
    pinColor?: string;
    // Add other Marker props as needed
  }

  export const MapView: React.ComponentType<MapViewProps>;
  export const Marker: React.ComponentType<MarkerProps>;

  // Export other components as needed
  export const PROVIDER_DEFAULT: string;
  export const PROVIDER_GOOGLE: string;

  // Add other exports as needed
}
