import io from 'socket.io-client';
import { API_ROUTES } from '../config/network';

// Use the base URL from network config
const socket = io(API_ROUTES.base, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
});

export { socket };