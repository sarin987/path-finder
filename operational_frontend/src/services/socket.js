import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketManager {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  async connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    try {
      // Disconnect existing socket if any
      if (this.socket) {
        this.socket.disconnect();
      }

      // Create new socket connection
      this.socket = io(API_BASE_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        query: { token },
      });

      // Set up global error handler
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.emit('error', error);
      });

      return new Promise((resolve, reject) => {
        const onConnect = () => {
          this.socket.off('connect_error', onError);
          resolve(this.socket);
        };

        const onError = (error) => {
          this.socket.off('connect', onConnect);
          reject(error);
        };

        this.socket.once('connect', onConnect);
        this.socket.once('connect_error', onError);
      });
    } catch (error) {
      console.error('Failed to connect to socket:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  getSocket() {
    return this.socket;
  }

  on(event, callback) {
    if (!this.socket) {return;}
    this.socket.on(event, callback);

    // Store the listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (!this.socket) {return;}

    if (callback) {
      this.socket.off(event, callback);
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: Socket not connected`);
    }
  }

  // Helper method to wait for connection
  async waitForConnection() {
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket not initialized'));
      }

      const timeout = setTimeout(() => {
        this.socket.off('connect', onConnect);
        this.socket.off('connect_error', onError);
        reject(new Error('Connection timeout'));
      }, 10000);

      const onConnect = () => {
        clearTimeout(timeout);
        this.socket.off('connect_error', onError);
        resolve();
      };

      const onError = (error) => {
        clearTimeout(timeout);
        this.socket.off('connect', onConnect);
        reject(error);
      };

      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onError);
    });
  }
}

// Create a singleton instance
export const socketManager = new SocketManager();

export default socketManager;
