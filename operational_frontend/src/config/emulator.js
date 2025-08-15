// config/emulator.js
import { Platform } from 'react-native';

// Emulator host - use 10.0.2.2 for Android emulator, localhost for iOS
const EMULATOR_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

// Connect to Firebase emulators
const connectToEmulators = () => {
  if (!__DEV__) {
    console.log('Not in development mode, skipping emulator connection');
    return;
  }

  try {
    console.log('Connecting to Firebase emulators...');

    // Connect to Firestore emulator
    if (db) {
      db.useEmulator(EMULATOR_HOST, 8080);
      console.log('Connected to Firestore emulator');
    }

    // Connect to Auth emulator
    if (auth) {
      auth.useEmulator(`http://${EMULATOR_HOST}:9099`);
      console.log('Connected to Auth emulator');
    }

    // Connect to Storage emulator
    if (storage) {
      storage.useEmulator(EMULATOR_HOST, 9199);
      console.log('Connected to Storage emulator');
    }

    console.log('Successfully connected to all available emulators');
  } catch (error) {
    console.warn('Error connecting to emulators:', error);
  }
};

export default connectToEmulators;
