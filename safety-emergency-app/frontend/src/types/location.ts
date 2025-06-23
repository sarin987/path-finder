export interface Location {
  id: string;
  userId: string;
  name: string;
  role: string;
  lat: number;
  lng: number;
  status?: string;
  lastUpdated?: string;
  phone?: string;
}
