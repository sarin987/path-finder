declare module 'react-native-maps' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export interface MapViewProps extends ViewProps {
    // Add any specific props you use from react-native-maps
    initialRegion?: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
    onRegionChange?: (region: any) => void;
    // Add other props as needed
  }

  const MapView: ComponentType<MapViewProps>;
  export default MapView;

  // Add other components you use from react-native-maps
  export const Marker: ComponentType<any>;
  export const Polyline: ComponentType<any>;
  export const Polygon: ComponentType<any>;
  export const Circle: ComponentType<any>;
  export const UrlTile: ComponentType<any>;
  export const Callout: ComponentType<any>;
  export const CalloutSubview: ComponentType<any>;
  export const Overlay: ComponentType<any>;
  export const LocalTile: ComponentType<any>;
  export const Heatmap: ComponentType<any>;
  export const WMSTile: ComponentType<any>;
  export const PROVIDER_DEFAULT: string;
  export const PROVIDER_GOOGLE: string;
}
