// Tell TypeScript to ignore the react-native-maps module
declare module 'react-native-maps' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  const MapView: ComponentType<any>;
  const Marker: ComponentType<any>;
  const Polyline: ComponentType<any>;
  const Polygon: ComponentType<any>;
  const Circle: ComponentType<any>;
  const Callout: ComponentType<any>;
  const Overlay: ComponentType<any>;
  
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
