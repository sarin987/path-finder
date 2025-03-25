import { initializeApp } from 'firebase/app';  // Import the initializeApp function
import { getAuth, PhoneAuthProvider, signInWithCredential } from "firebase/auth";// Import auth methods
import { getStorage} from 'firebase/storage'; // Import storage methods


// Firebase Configuration (Replace with your actual Firebase credentials)

const firebaseConfig = {
  apiKey: "AIzaSyBD8FY3LgRnaDTzgE5EYuvqzMk_sInyC5g", // Ensure this is correct
  authDomain: "https://accounts.google.com/o/oauth2/auth",
  projectId: "corosole-core21",
  storageBucket: "gs://corosole-core21.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "1:132352997002:android:50c2a69bda07a31219df73",
};


// Initialize Firebase if not already initialized
// Initialize Firebase
const app = initializeApp(firebaseConfig);  // Initialize Firebase app
const auth = getAuth(app);  // Get Firebase Auth instance
const storage = getStorage(app);  // Get Firebase Storage instance

export { auth, storage,  PhoneAuthProvider, signInWithCredential};