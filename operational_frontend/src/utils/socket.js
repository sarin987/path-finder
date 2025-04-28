import io from 'socket.io-client';

// Replace with your actual server URL
const socket = io('http://192.168.1.4:5000', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
});

export { socket };