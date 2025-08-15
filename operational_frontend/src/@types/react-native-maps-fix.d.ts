// Fix for react-native-maps type conflicts
declare module 'react-native-maps/lib/components/MapView' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export interface MapViewProps extends ViewProps {
    // Add necessary MapView props here
  }

  const MapView: ComponentType<MapViewProps>;
  export default MapView;
}

declare module 'react-native-maps' {
  export * from 'react-native-maps/lib/components/MapView';
  // Re-export other components as needed
  export { default as default } from 'react-native-maps/lib/components/MapView';
}
