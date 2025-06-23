import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { WEBSOCKET_URL } from '../config';

export const useSocket = (url = WEBSOCKET_URL, handlers = {}) => {
  const socketRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const setupSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        
        // Initialize socket connection
        socketRef.current = io(url, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          auth: { token }
        });

        // Add event handlers
        Object.entries(handlers).forEach(([event, handler]) => {
          socketRef.current.on(event, handler);
        });

        setIsReady(true);
      } catch (error) {
        console.error('Socket setup error:', error);
        setIsReady(false);
      }
    };

    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        setupSocket();
      }
    });

    setupSocket();

    return () => {
      appStateSubscription.remove();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url, handlers]);

  return {
    socket: socketRef.current,
    isReady
  };
};