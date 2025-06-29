// services/api.js
// Centralized API service for backend REST endpoints
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Update to your backend URL

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
