import type { LatLngTuple } from 'leaflet';

export interface Location {
  id: string;
  userId: string;
  name: string;
  role: string;
  lat: number;
  lng: number;
  status: string;
  lastUpdated: string;
  phone?: string;
}

export interface LocationMapProps {
  role: string;
  className?: string;
  style?: React.CSSProperties;
  onLocationClick?: (location: Location) => void;
}

export const DEFAULT_CENTER: LatLngTuple = [12.9716, 77.5946]; // Bangalore coordinates