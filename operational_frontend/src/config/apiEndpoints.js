import { API_VERSION } from './index';

export const ENDPOINTS = {
  // Auth
  LOGIN: `auth/login`,
  VERIFY_OTP: `auth/verify-otp`,
  
  // Location
  UPDATE_LOCATION: `location/update`,
  
  // Check-in
  PENDING_CHECKINS: (userId) => `checkin/pending/${userId}`,
  SCHEDULE_CHECKIN: `checkin/schedule`,
  ACKNOWLEDGE_CHECKIN: `checkin/ack`,
  
  // Resources
  RESOURCE_AVAILABILITY: `resources/availability`,
  
  // Health
  HEALTH_EVENT: `health/event`,
  HEALTH_HISTORY: (userId) => `health/history/${userId}`,
  
  // Contacts
  LIST_CONTACTS: (userId) => `contacts/list/${userId}`,
  ADD_CONTACT: `contacts/add`,
  SEND_ALERT: `contacts/alert`,
  
  // Agencies
  AGENCIES_ALL: `agencies/all`,
  AGENCIES_RESOURCES: `agencies/resources`,
  AGENCIES_INCIDENTS: `agencies/incidents`,
  
  // User
  USER_PROFILE: (userId) => `users/${userId}`,
  UPDATE_PROFILE: (userId) => `users/${userId}`,
  
  // Routes
  SUGGEST_SAFE_ROUTE: `routes/safe`,
};

export default ENDPOINTS;
