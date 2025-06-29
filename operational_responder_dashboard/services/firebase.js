// config/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBD8FY3LgRnaDTzgE5EYuvqzMk_sInyC5g", // Ensure this is correct
  authDomain: "corosole-core21.firebaseapp.com", // <-- FIXED: use your Firebase project's authDomain
  projectId: "corosole-core21",
  storageBucket: "gs://corosole-core21.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "1:132352997002:android:50c2a69bda07a31219df73",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);