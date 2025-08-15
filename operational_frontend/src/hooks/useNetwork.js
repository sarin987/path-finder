import { useState, useEffect } from 'react';
import { NetInfo } from 'react-native';

export const useNetwork = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const handleConnectivityChange = (state) => {
      setIsConnected(state.isConnected);
    };

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);

    // Check initial state
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isConnected;
};
