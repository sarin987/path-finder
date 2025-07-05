// services/api.js
// Centralized API service for backend REST endpoints
import axios from 'axios';

// Use ngrok URL for development, fallback to localhost
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'https://3bf6-2401-4900-881e-1353-d678-d6fc-de47-c356.ngrok-free.app/api'
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Example: Fetch incidents by role
export const fetchIncidents = (role) =>
  api.get(`/incidents?role=${role}`);

// Example: Accept an incident
export const acceptIncident = (responderId, incidentId) =>
  api.post(`/responders/${responderId}/accept`, { incidentId });

// Example: Get media for an incident
export const fetchMedia = (incidentId) =>
  api.get(`/media/${incidentId}`);

// Example: Update status
export const updateStatus = (data) =>
  api.post('/status-update', data);

export default api;
