import { initializeApp } from 'firebase/app';  // Import the initializeApp function
import { getAuth, PhoneAuthProvider, signInWithCredential } from "firebase/auth";// Import auth methods
import { getStorage} from 'firebase/storage'; // Import storage methods


// Firebase Configuration (Replace with your actual Firebase credentials)

const firebaseConfig = {
  apiKey: "AIzaSyBD8FY3LgRnaDTzgE5EYuvqzMk_sInyC5g",
  authDomain: "corosole-core21.firebaseapp.com",
  projectId: "corosole-core21",
  storageBucket: "corosole-core21.firebasestorage.app",
  messagingSenderId: "132352997002",
  appId: "1:132352997002:web:50c2a69bda07a31219df73",
  measurementId: "G-MEASUREMENT_ID"
};


// Initialize Firebase if not already initialized
// Initialize Firebase
const app = initializeApp(firebaseConfig);  // Initialize Firebase app
const auth = getAuth(app);  // Get Firebase Auth instance
const storage = getStorage(app);  // Get Firebase Storage instance

export { auth, storage,  PhoneAuthProvider, signInWithCredential};