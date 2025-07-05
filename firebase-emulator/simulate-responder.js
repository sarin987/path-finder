const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp, connectFirestoreEmulator } = require('firebase/firestore');

// Your Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to Firestore emulator
connectFirestoreEmulator(db, 'localhost', 8080);

// Simulate a police officer
const responderId = 'test-responder-1';
const responderRef = doc(db, 'responders', responderId);

// Initial position - adjust these coordinates to be near your location
let lat = 18.5739;  // Example: Pune coordinates
let lng = 73.7593;

console.log('Starting responder simulation...');
console.log('Press Ctrl+C to stop');

// Update position every 5 seconds
const interval = setInterval(async () => {
  // Add some random movement
  lat += (Math.random() * 0.001 - 0.0005);
  lng += (Math.random() * 0.001 - 0.0005);
  
  const responderData = {
    id: responderId,
    role: 'police',
    name: 'Test Officer',
    status: 'Available',
    latitude: lat,
    longitude: lng,
    online: true,
    lastSeen: serverTimestamp(),
    phone: '+1234567890',
    vehicleNumber: 'MH12AB1234'
  };

  try {
    await setDoc(responderRef, responderData, { merge: true });
    console.log(`Updated responder position: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  } catch (error) {
    console.error('Error updating responder:', error);
  }
}, 5000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nStopping simulation...');
  clearInterval(interval);
  process.exit(0);
});
