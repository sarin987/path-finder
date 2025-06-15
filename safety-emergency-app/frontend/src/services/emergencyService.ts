import { api } from './api';
import type { Emergency, EmergencyFilters, EmergencyStatus } from '@/types/emergency';

export const emergencyService = {
  // Create a new emergency
  async createEmergency(emergencyData: Partial<Emergency>): Promise<Emergency> {
    try {
      const response = await api.post<Emergency>('/emergency', emergencyData);
      return response;
    } catch (error) {
      console.error('Create emergency error:', error);
      throw error;
    }
  },

  // Get emergencies with optional filters
  async getEmergencies(filters: EmergencyFilters = {}): Promise<{
    data: Emergency[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params if they exist
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.severity) queryParams.append('severity', filters.severity);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await api.get<{
        data: Emergency[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/emergency?${queryParams.toString()}`);
      
      return response;
    } catch (error) {
      console.error('Get emergencies error:', error);
      throw error;
    }
  },

  // Get emergency by ID
  async getEmergency(id: string): Promise<Emergency> {
    try {
      const response = await api.get<Emergency>(`/emergency/${id}`);
      return response;
    } catch (error) {
      console.error('Get emergency by ID error:', error);
      throw error;
    }
  },

  // Update emergency status
  async updateEmergencyStatus(
    id: string,
    status: EmergencyStatus
  ): Promise<Emergency> {
    try {
      const response = await api.put<Emergency>(`/emergency/${id}/status`, {
        status,
      });
      return response;
    } catch (error) {
      console.error('Update emergency status error:', error);
      throw error;
    }
  },

  // Assign emergency to a responder
  async assignEmergency(
    emergencyId: string,
    responderId: string
  ): Promise<Emergency> {
    try {
      const response = await api.put<Emergency>(
        `/emergency/${emergencyId}/assign`,
        { responderId }
      );
      return response;
    } catch (error) {
      console.error('Assign emergency error:', error);
      throw error;
    }
  },
};
