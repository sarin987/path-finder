// config/firebase.js
import { initializeApp } from '@react-native-firebase/app';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCVDR5UaInNVOeouKckseXRITwFup351wA",
  authDomain: "corosole-core21.firebaseapp.com",
  projectId: "corosole-core21",
  storageBucket: "corosole-core21.firebasestorage.app",
  messagingSenderId: "132352997002",
  appId: "1:132352997002:web:50c2a69bda07a31219df73",
  measurementId: "G-MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

export const initializeFirebase = async () => {
  try {
    // Initialize core Firebase services
    await app; // This ensures the app is initialized
    
    // Initialize messaging
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    await AsyncStorage.setItem('fcmToken', token);
    
    return token;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
};

export const onMessageReceived = messaging().onMessage(async remoteMessage => {
  console.log('Received foreground message:', remoteMessage);
  // Handle foreground messages here
});

export default app;