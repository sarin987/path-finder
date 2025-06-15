import axios from 'axios';
import config from '../config';

interface AppConfig {
  API_URL: string;
  GOOGLE_MAPS_API_KEY: string;
  WS_URL: string;
  MAP_DEFAULTS: {
    center: {
      lat: number;
      lng: number;
    };
    zoom: number;
  };
}

// Type assertion for config
const appConfig = config as unknown as AppConfig;

interface SOSRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  lat: number;
  lng: number;
  message: string;
  status: 'pending' | 'in-progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export const getSOSRequests = async (token: string): Promise<SOSRequest[]> => {
  try {
    const response = await axios.get(`${appConfig.API_URL}/sos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching SOS requests:', error);
    throw error;
  }
};

export const createSOSRequest = async (
  token: string,
  data: {
    lat: number;
    lng: number;
    message: string;
  }
): Promise<SOSRequest> => {
  try {
    const response = await axios.post(
      `${appConfig.API_URL}/sos`,
      { ...data },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating SOS request:', error);
    throw error;
  }
};

export const updateSOSStatus = async (
  token: string,
  sosId: string,
  status: 'in-progress' | 'resolved'
): Promise<SOSRequest> => {
  try {
    const response = await axios.patch(
      `${appConfig.API_URL}/sos/${sosId}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating SOS status:', error);
    throw error;
  }
};
