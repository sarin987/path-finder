// Custom type declarations for react-native-maps
declare module 'react-native-maps' {
  import { ComponentType } from 'react';
  import { ViewProps, NativeSyntheticEvent, ViewStyle, Animated, ColorValue } from 'react-native';

  export interface MapViewProps extends ViewProps {
    // Add common MapView props here
    style?: ViewStyle;
    provider?: 'google' | null;
    initialRegion?: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
    // Add other props as needed
  }

  export interface MarkerProps {
    coordinate: {
      latitude: number;
      longitude: number;
    };
    title?: string;
    description?: string;
    pinColor?: string;
    // Add other marker props as needed
  }

  export interface PolylineProps {
    coordinates: Array<{
      latitude: number;
      longitude: number;
    }>;
    strokeColor?: string;
    strokeWidth?: number;
    // Add other polyline props as needed
  }

  export interface PolygonProps {
    coordinates: Array<{
      latitude: number;
      longitude: number;
    }>;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    // Add other polygon props as needed
  }

  export interface CircleProps {
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    // Add other circle props as needed
  }

  export interface CalloutProps {
    // Add callout props as needed
  }

  export interface OverlayProps {
    // Add overlay props as needed
  }

  // Component declarations
  const MapView: ComponentType<MapViewProps>;
  const Marker: ComponentType<MarkerProps>;
  const Polyline: ComponentType<PolylineProps>;
  const Polygon: ComponentType<PolygonProps>;
  const Circle: ComponentType<CircleProps>;
  const Callout: ComponentType<CalloutProps>;
  const Overlay: ComponentType<OverlayProps>;

  // Export components
  export {
    MapView,
    Marker,
    Polyline,
    Polygon,
    Circle,
    Callout,
    Overlay,
  };

  export default MapView;
}
