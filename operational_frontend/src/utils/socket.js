import io from 'socket.io-client';
import { API_ROUTES } from '../config/network';

// Create a class to manage socket connections and events
class SocketManager {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // Initialize socket connection
  connect(authToken) {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(API_ROUTES.base, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      auth: { token: authToken },
    });

    // Set up event forwarding
    this.socket.onAny((event, ...args) => {
      const handlers = this.listeners.get(event) || [];
      handlers.forEach(handler => handler(...args));
    });

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  // Unsubscribe from an event
  off(event, callback) {
    if (this.listeners.has(event)) {
      const handlers = this.listeners.get(event);
      handlers.delete(callback);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Emit an event
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Location-specific methods
  updateLocation(locationData) {
    this.emit('responder_location_update', locationData);
  }

  subscribeToResponderLocations(callback) {
    this.emit('subscribe_to_responders');
    return this.on('responder_location_updated', callback);
  }

  subscribeToRoleLocations(role, callback) {
    this.emit('subscribe_to_role', role);
    return this.on('responder_location_updated', (data) => {
      if (data.role === role) {
        callback(data);
      }
    });
  }

  markAsOffline() {
    this.emit('responder_offline');
  }
}

// Create a singleton instance
export const socketManager = new SocketManager();

export default socketManager;