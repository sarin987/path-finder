// config/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, connectAuthEmulator, getAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { isWeb } from '../utils/platform';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVDR5UaInNVOeouKckseXRITwFup351wA",
  authDomain: "corosole-core21.firebaseapp.com",
  projectId: "corosole-core21",
  storageBucket: "corosole-core21.appspot.com",
  messagingSenderId: "132352997002",
  appId: "1:132352997002:web:50c2a69bda07a31219df73"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

// Lazy load messaging to prevent initialization issues
let messagingInstance = null;

// Initialize Firebase services
const initializeFirebase = () => {
  try {
    if (!app) {
      // Check if Firebase app is already initialized
      const apps = getApps();
      if (apps.length > 0) {
        app = getApp();
      } else {
        // Initialize Firebase app if not already initialized
        app = initializeApp(firebaseConfig);
      }
      
      // Initialize Auth with persistence
      try {
        auth = getAuth(app);
      } catch (e) {
        // If getAuth fails, initialize auth with platform-specific persistence
        if (isWeb) {
          auth = initializeAuth(app, {
            persistence: browserLocalPersistence
          });
        } else {
          // For React Native, use the React Native Firebase SDK
          // Import React Native Firebase Auth
          const authModule = require('@react-native-firebase/auth').default;
          auth = authModule();
        }
      }
      
      // Initialize Firestore
      if (isWeb) {
        db = getFirestore(app);
      } else {
        // For React Native, use the React Native Firebase SDK
        const firestoreModule = require('@react-native-firebase/firestore').default;
        db = firestoreModule();
      }
      
      // Initialize Storage
      if (isWeb) {
        storage = getStorage(app);
      } else {
        // For React Native, use the React Native Firebase SDK
        const storageModule = require('@react-native-firebase/storage').default;
        storage = storageModule();
      }
      
      // Connect to emulators in development
      if (__DEV__) {
        const EMULATOR_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
        
        try {
          if (isWeb) {
            // Connect Firestore emulator
            connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
            
            // Connect Auth emulator
            connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`);
            
            // Connect Storage emulator
            connectStorageEmulator(storage, EMULATOR_HOST, 9199);
          } else {
            // For React Native, use the React Native Firebase SDK emulator methods
            if (db && db.useEmulator) {
              db.useEmulator(EMULATOR_HOST, 8080);
            }
            if (auth && auth.useEmulator) {
              auth.useEmulator(`http://${EMULATOR_HOST}:9099`);
            }
            if (storage && storage.useEmulator) {
              storage.useEmulator(EMULATOR_HOST, 9199);
            }
          }
          
          console.log('Connected to Firebase emulators');
        } catch (emulatorError) {
          console.warn('Failed to connect to emulators:', emulatorError);
        }
      }
    }
    
    return { app, auth, db, storage };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
};

// Initialize Firebase immediately
initializeFirebase();

// Initialize Firebase Messaging
const initializeMessaging = async () => {
  if (!messagingInstance) {
    try {
      const messagingModule = await import('@react-native-firebase/messaging');
      messagingInstance = messagingModule.default;
      
      // Request permissions and get token
      await messagingInstance().requestPermission();
      await messagingInstance().registerDeviceForRemoteMessages();
      const token = await messagingInstance().getToken();
      await AsyncStorage.setItem('fcmToken', token);
      
      console.log('Firebase Messaging initialized');
      return token;
    } catch (error) {
      console.warn('Firebase Messaging not available:', error);
      return null;
    }
  }
  return messagingInstance;
};

// Set up message handlers
export const setupMessageHandlers = async (onMessage) => {
  try {
    const messaging = await initializeMessaging();
    if (messaging) {
      return messaging().onMessage(onMessage);
    }
  } catch (error) {
    console.warn('Failed to set up message handlers:', error);
  }
  return () => {}; // Return empty cleanup function
};

// Export individual services with safe initialization
export const getFirebaseApp = () => {
  if (!app) {
    try {
      return initializeFirebase().app;
    } catch (e) {
      console.error('Failed to get Firebase app:', e);
      return getApp();
    }
  }
  return app;
};

export const getAuthInstance = () => {
  if (!auth) {
    try {
      return initializeFirebase().auth;
    } catch (e) {
      console.error('Failed to get Auth instance:', e);
      if (isWeb) {
        return getAuth(getApp());
      } else {
        const authModule = require('@react-native-firebase/auth').default;
        return authModule();
      }
    }
  }
  return auth;
};

export const getFirestoreInstance = () => {
  if (!db) {
    try {
      return initializeFirebase().db;
    } catch (e) {
      console.error('Failed to get Firestore instance:', e);
      if (isWeb) {
        return getFirestore(getApp());
      } else {
        const firestoreModule = require('@react-native-firebase/firestore').default;
        return firestoreModule();
      }
    }
  }
  return db;
};

export const getStorageInstance = () => {
  if (!storage) {
    try {
      return initializeFirebase().storage;
    } catch (e) {
      console.error('Failed to get Storage instance:', e);
      if (isWeb) {
        return getStorage(getApp());
      } else {
        const storageModule = require('@react-native-firebase/storage').default;
        return storageModule();
      }
    }
  }
  return storage;
};

export const getMessaging = () => {
  if (!messagingInstance) {
    console.warn('Messaging not initialized. Call initializeMessaging() first.');
  }
  return messagingInstance;
};

// Export initialization functions
export { initializeFirebase, initializeMessaging };

// Default export with all services
export default {
  // Services
  get app() { return getFirebaseApp(); },
  get auth() { return getAuthInstance(); },
  get db() { return getFirestoreInstance(); },
  get storage() { return getStorageInstance(); },
  
  // Initialization
  initializeFirebase,
  initializeMessaging,
  setupMessageHandlers,
  
  // Individual getters
  getFirebaseApp,
  getAuthInstance,
  getFirestoreInstance,
  getStorageInstance,
  getMessaging
};