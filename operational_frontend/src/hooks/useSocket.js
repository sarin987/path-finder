import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

export const useSocket = (url, handlers = {}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      auth: {
        token: localStorage.getItem('userToken')
      }
    });

    // Add event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socketRef.current.on(event, handler);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [url]);

  return socketRef.current;
};