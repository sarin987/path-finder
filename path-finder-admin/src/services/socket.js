import io from 'socket.io-client';

// Connect to the operational backend server
const SOCKET_URL = 'http://192.168.1.4:5000'; // Update this URL based on your backend server location
const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket']
});

// Identify as web client
socket.emit('identify', 'web');

// Export socket instance
export default socket;

// Export socket events
export const socketEvents = {
  // Emergency events
  NEW_EMERGENCY_CALL: 'newEmergencyCall',
  EMERGENCY_LOCATION_UPDATE: 'locationUpdate',
  
  // Police events
  POLICE_LOCATION_UPDATE: 'locationUpdate',
  CASE_STATUS_UPDATE: 'caseStatusUpdate',
  
  // Chat events
  NEW_MESSAGE: 'newMessage',
  
  // Location events
  LOCATION_REQUEST: 'locationRequest'
};

// Export socket helpers
export const socketHelpers = {
  // Emergency call handling
  sendEmergencyCall: (data) => {
    socket.emit(socketEvents.NEW_EMERGENCY_CALL, data);
  },
  
  // Location updates
  sendLocationUpdate: (data) => {
    socket.emit(socketEvents.EMERGENCY_LOCATION_UPDATE, data);
  },
  
  // Chat messages
  sendMessage: (data) => {
    socket.emit(socketEvents.NEW_MESSAGE, data);
  },
  
  // Case status updates (only web dashboard can update cases)
  updateCaseStatus: (caseId, status) => {
    socket.emit(socketEvents.CASE_STATUS_UPDATE, { caseId, status });
  }
};

// Error handling
socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});