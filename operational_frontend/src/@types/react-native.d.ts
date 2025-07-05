import 'react-native';

declare module 'react-native' {
  interface NativeMethods {
    measure: (callback: MeasureOnSuccessCallback) => void;
    measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void;
    measureLayout: (
      relativeToNativeNode: number,
      onSuccess: (x: number, y: number, width: number, height: number) => void,
      onFail?: () => void
    ) => void;
    setNativeProps: (nativeProps: object) => void;
    focus: () => void;
    blur: () => void;
  }

  // More permissive type for NativeComponent to handle react-native-maps
  type NativeComponent<T> = React.ComponentType<T> & NativeMethods;
  
  // More permissive type for HostComponent
  type HostComponent<P = {}, T = any> = React.ComponentType<P> & {
    new (props: P, context?: any): React.Component<P> & {
      _nativeTag: number;
      viewConfig: any;
    };
  }
}

declare module 'react-native-maps' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export interface MapViewProps extends ViewProps {
    // Add any specific MapView props you use in your project
    initialRegion?: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
    onRegionChange?: (region: any) => void;
    onRegionChangeComplete?: (region: any) => void;
  }

  export const MapView: ComponentType<MapViewProps>;
  export const Marker: ComponentType<any>;
  export const Polyline: ComponentType<any>;
  export const Polygon: ComponentType<any>;
  export const Circle: ComponentType<any>;
  export const Callout: ComponentType<any>;
  export const Overlay: ComponentType<any>;
  
  export default MapView;
}
