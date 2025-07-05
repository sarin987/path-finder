import { initializeApp } from 'firebase/app'; 
import { 
  getAuthInstance,
  getStorageInstance,
  PhoneAuthProvider,
  signInWithCredential
} from '../config/firebase';

// Re-export auth and storage instances from the centralized config
export const auth = getAuthInstance();
export const storage = getStorageInstance();

// Export auth methods
export { PhoneAuthProvider, signInWithCredential };

// This file is now a thin wrapper around the main Firebase configuration
// All Firebase initialization should be done in src/config/firebase.js