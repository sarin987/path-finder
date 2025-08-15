import { RefObject } from 'react';
import { LatLng } from 'react-native-maps';

export interface ResponderLocation {
  id?: string;
  userId: string;
  role: string;
  status: 'available' | 'busy' | 'offline' | string;
  latitude: number;
  longitude: number;
  lastUpdated: Date | string;
  distance?: number;
  distanceFormatted?: string;
  [key: string]: any; // Allow additional properties
}

export interface UseResponderLocationsOptions {
  center?: {
    latitude: number;
    longitude: number;
  };
  radius?: number; // in kilometers
  enabled?: boolean;
  roles?: string[];
  sortByProximity?: boolean;
  filterByRole?: boolean;
  maxDistance?: number; // in kilometers
}

export interface UseResponderLocationsResult {
  // Raw data
  responders: ResponderLocation[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  socketConnected: boolean;

  // Derived data
  responderCounts: Record<string, number>;
  availableRoles: string[];

  // Actions
  refetch: () => Promise<void>;

  // Helpers
  getResponderById: (id: string) => ResponderLocation | undefined;
  getRespondersByRole: (role: string) => ResponderLocation[];
  getClosestResponder: () => ResponderLocation | null;

  // Status
  hasResponders: boolean;
  totalResponders: number;
}

/**
 * Hook to fetch and manage responder locations in real-time
 * @param options Configuration options for the hook
 * @returns An object containing responder data and helper methods
 */
declare function useResponderLocations(
  options?: UseResponderLocationsOptions
): UseResponderLocationsResult;

export default useResponderLocations;
