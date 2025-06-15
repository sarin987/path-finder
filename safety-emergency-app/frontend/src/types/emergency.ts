import type { User } from './auth';

export type EmergencyType = 'medical' | 'fire' | 'police' | 'other';
export type EmergencyStatus = 'pending' | 'in-progress' | 'resolved' | 'cancelled';
export type EmergencySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface EmergencyLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Emergency {
  id: string;
  userId: string;
  type: EmergencyType;
  status: EmergencyStatus;
  location: EmergencyLocation;
  address?: string;
  description?: string;
  severity: EmergencySeverity;
  assignedTo?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  reporter?: User;
  responder?: User | null;
}

export interface EmergencyFilters {
  status?: EmergencyStatus;
  type?: EmergencyType;
  severity?: EmergencySeverity;
  page?: number;
  limit?: number;
  userId?: string;
}

export interface CreateEmergencyDto {
  type: EmergencyType;
  location: EmergencyLocation;
  address?: string;
  description?: string;
  severity?: EmergencySeverity;
}

export interface UpdateEmergencyStatusDto {
  status: EmergencyStatus;
}

export interface AssignEmergencyDto {
  responderId: string;
}
