import NetInfo from '@react-native-community/netinfo';
import { API_ROUTES } from '../config';

export const checkNetworkConnection = async () => {
  try {
    const state = await NetInfo.fetch();
    console.log('Network state:', state);
    
    if (!state.isConnected) {
      throw new Error('No network connection');
    }

    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Network check error:', error);
    return false;
  }
};

export const checkApiHealth = async () => {
  try {
    console.log('Checking API health...');
    const response = await fetch(`${API_ROUTES.base}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Health check response:', data);

    return {
      isHealthy: response.ok && data.status === 'ok',
      timestamp: data.timestamp,
      message: data.message || 'API is healthy'
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      isHealthy: false,
      message: 'Cannot reach API server'
    };
  }
};