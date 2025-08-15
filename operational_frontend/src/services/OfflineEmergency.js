import { PriorityQueue } from '../utils/PriorityQueue';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class OfflineEmergencyService {
  constructor() {
    this.queue = new PriorityQueue();
    this.STORAGE_KEY = '@offline_emergencies';
  }

  async handleOfflineEmergency(emergency) {
    try {
      // Add to priority queue with high priority for emergencies
      this.queue.add(emergency, 10);

      // Store in AsyncStorage for persistence
      await this.saveToStorage();

      // Try to process offline
      return await this.processOfflineEmergency(emergency);
    } catch (error) {
      console.error('Offline emergency handling error:', error);
      throw error;
    }
  }

  async processOfflineEmergency(emergency) {
    try {
      // Get cached protocols
      const protocol = await this.getOfflineProtocol(emergency.type);

      // Store emergency details locally
      await this.storeEmergencyLocally(emergency);

      return {
        success: true,
        protocol,
        queuePosition: this.queue.size(),
      };
    } catch (error) {
      console.error('Process offline emergency error:', error);
      throw error;
    }
  }

  async saveToStorage() {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.queue.values)
      );
    } catch (error) {
      console.error('Save to storage error:', error);
    }
  }

  async loadFromStorage() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored);
        items.forEach(item => this.queue.add(item.element, item.priority));
      }
    } catch (error) {
      console.error('Load from storage error:', error);
    }
  }

  async getOfflineProtocol(type) {
    // Return cached emergency protocols based on type
    const protocols = {
      medical: {
        steps: ['Check breathing', 'Apply first aid', 'Find nearest hospital'],
        contacts: ['Emergency Services', 'Local Hospital'],
      },
      fire: {
        steps: ['Evacuate area', 'Call fire department', 'Help others'],
        contacts: ['Fire Department', 'Emergency Services'],
      },
      security: {
        steps: ['Find safe location', 'Contact authorities', 'Document incident'],
        contacts: ['Police', 'Security Services'],
      },
    };

    return protocols[type] || protocols.medical;
  }

  async storeEmergencyLocally(emergency) {
    try {
      const key = `@emergency_${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        ...emergency,
        timestamp: Date.now(),
        processed: false,
      }));
    } catch (error) {
      console.error('Store emergency locally error:', error);
    }
  }
}
