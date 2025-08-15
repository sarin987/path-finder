// Initialize Firebase
import { AppRegistry } from 'react-native';
import { initializeApp } from '@react-native-firebase/app';

// Your web app's Firebase configuration
// Replace with your Firebase config object
const firebaseConfig = {
  // Your Firebase config here
  // Example:
  apiKey: "AIzaSyA8oR31wo32kTOZuG9pTB9gsjmcde03dpw",
  authDomain: "corosole-core21.firebaseapp.com",
  projectId: "corosole-core21",
  storageBucket: "corosole-core21.firebasestorage.app",
  messagingSenderId: "132352997002",
  appId: "1:132352997002:android:50c2a69bda07a31219df73"
};

// Initialize Firebase
let app;

try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export default app;
