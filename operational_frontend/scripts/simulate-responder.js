const { initializeApp } = require('@react-native-firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp, connectFirestoreEmulator } = require('@react-native-firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCVDR5UaInNVOeouKckseXRITwFup351wA',
  authDomain: 'corosole-core21.firebaseapp.com',
  projectId: 'corosole-core21',
  storageBucket: 'corosole-core21.appspot.com',
  messagingSenderId: '132352997002',
  appId: '1:132352997002:web:50c2a69bda07a31219df73',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to Firestore emulator
connectFirestoreEmulator(db, 'localhost', 8080);

// Simulate a responder
const responderId = 'test-responder-1';
const responderRef = doc(db, 'responders', responderId);

// Initial position (Pune, India)
let lat = 18.5204;
let lng = 73.8567;

console.log('🚨 Starting responder simulation...');
console.log('Press Ctrl+C to stop');

// Update position every 5 seconds
const interval = setInterval(async () => {
  // Add some random movement (small changes to simulate movement)
  lat += (Math.random() * 0.001 - 0.0005);
  lng += (Math.random() * 0.001 - 0.0005);

  const responderData = {
    id: responderId,
    role: 'police',
    name: 'Patrol Officer',
    status: 'Available',
    latitude: lat,
    longitude: lng,
    online: true,
    lastSeen: serverTimestamp(),
    phone: '+911234567890',
    vehicleNumber: 'MH12AB1234',
    batteryLevel: Math.floor(Math.random() * 30) + 70, // 70-100%
    speed: Math.floor(Math.random() * 60), // 0-60 km/h
    heading: Math.floor(Math.random() * 360), // 0-359 degrees
  };

  try {
    await setDoc(responderRef, responderData, { merge: true });
    console.log(`📍 Updated responder position: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  } catch (error) {
    console.error('❌ Error updating responder:', error);
  }
}, 5000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping simulation...');
  clearInterval(interval);
  process.exit(0);
});
