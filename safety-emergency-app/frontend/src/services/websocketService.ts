import { io, Socket } from 'socket.io-client';

// Types for WebSocket events
export interface LocationUpdateData {
  userId: string;
  lat: number;
  lng: number;
  role: string;
  name?: string;
  phone?: string;
  status?: string;
  lastUpdated?: string;
  // Add any additional fields that might be sent from the server
  [key: string]: unknown;
}

type EventCallback<T> = (data: T) => void;

const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private callbacks: Map<string, Set<EventCallback<any>>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(token: string, userId: string, role: string): void {
    if (this.socket?.connected) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      return;
    }

    // Clean up existing socket if any
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      query: { userId, role },
      transports: ['websocket'],
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // Connection established
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      this.socket?.emit('authenticate', { userId, role });
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms...`);
    });

    // Disconnected
    this.socket.on('disconnect', (reason) => {
      console.log(`WebSocket disconnected: ${reason}`);
      if (reason === 'io server disconnect') {
        // The server was restarted, try to reconnect
        this.socket?.connect();
      }
    });

    // Reconnect all existing event listeners
    this.callbacks.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback);
      });
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public on<T = any>(event: string, callback: EventCallback<T>): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event)?.add(callback);
    this.socket?.on(event, callback);
  }

  public off(event: string, callback?: EventCallback<any>): void {
    if (callback) {
      this.callbacks.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    } else {
      this.callbacks.delete(event);
      this.socket?.off(event);
    }
  }

  public emit<T = any>(event: string, data?: T): void {
    if (!this.socket?.connected) {
      console.warn(`Attempted to emit '${event}' but socket is not connected`);
      return;
    }
    this.socket.emit(event, data);
  }

  public updateLocation(location: Omit<LocationUpdateData, 'userId' | 'role'>): void {
    this.emit('location-update', location);
  }

  public subscribeToRoleLocations(
    role: string, 
    callback: EventCallback<LocationUpdateData>
  ): () => void {
    const event = `location-update-${role}`;
    
    // Add type guard to ensure data matches LocationUpdateData
    const wrappedCallback: EventCallback<unknown> = (data: unknown) => {
      if (this.isLocationUpdateData(data)) {
        callback(data);
      } else {
        console.warn('Received invalid location data:', data);
      }
    };
    
    this.on(event, wrappedCallback);
    return () => this.off(event, wrappedCallback);
  }
  
  // Type guard for LocationUpdateData
  private isLocationUpdateData(data: unknown): data is LocationUpdateData {
    return (
      typeof data === 'object' && 
      data !== null &&
      'userId' in data &&
      typeof data.userId === 'string' &&
      'lat' in data &&
      typeof data.lat === 'number' &&
      'lng' in data &&
      typeof data.lng === 'number' &&
      'role' in data &&
      typeof data.role === 'string'
    );
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default WebSocketService.getInstance();
