import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ROUTES } from '../config';

class OfflineQueue {
  constructor() {
    this.key = '@offline_queue';
    this.processing = false;
    this.retryLimit = 3;
  }

  async add(action) {
    try {
      const queue = await this.get();
      const newItem = {
        ...action,
        timestamp: Date.now(),
        retryCount: 0,
        id: Math.random().toString(36).substr(2, 9)
      };
      
      queue.push(newItem);
      await AsyncStorage.setItem(this.key, JSON.stringify(queue));
      
      // Try to process immediately if possible
      this.process();
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  }

  async get() {
    try {
      const queue = await AsyncStorage.getItem(this.key);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting queue:', error);
      return [];
    }
  }

  async process() {
    if (this.processing) return;
    this.processing = true;

    try {
      const queue = await this.get();
      if (queue.length === 0) return;

      const processed = [];
      const failed = [];

      for (const item of queue) {
        if (item.retryCount >= this.retryLimit) {
          failed.push(item);
          continue;
        }

        try {
          await this.processItem(item);
          processed.push(item);
        } catch (error) {
          // Increment retry count
          item.retryCount += 1;
          if (item.retryCount < this.retryLimit) {
            failed.push(item);
          }
        }
      }

      // Keep failed items in queue
      const remaining = queue.filter(item => 
        !processed.find(p => p.id === item.id) && 
        item.retryCount < this.retryLimit
      );
      
      await AsyncStorage.setItem(this.key, JSON.stringify(remaining));
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.processing = false;
    }
  }

  async processItem(item) {
    switch (item.type) {
      case 'LOCATION_UPDATE':
        await axios.post(`${API_ROUTES.services}/location`, item.payload);
        break;
      
      case 'EMERGENCY_REQUEST':
        await axios.post(`${API_ROUTES.emergency}/request`, item.payload);
        break;
      
      case 'CANCEL_EMERGENCY':
        await axios.post(`${API_ROUTES.emergency}/cancel`, item.payload);
        break;
      
      default:
        throw new Error(`Unknown action type: ${item.type}`);
    }
  }

  async clear() {
    try {
      await AsyncStorage.removeItem(this.key);
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }
}

export const offlineQueue = new OfflineQueue();