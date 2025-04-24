// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc, getDoc, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBD8FY3LgRnaDTzgE5EYuvqzMk_sInyC5g",
  authDomain: "https://accounts.google.com/o/oauth2/auth",
  projectId: "corosole-core21",
  storageBucket: "gs://corosole-core21.firebasestorage.app",
  messagingSenderId: "132352997002",
  appId: "1:132352997002:web:50c2a69bda07a31219df73"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export collections
export const collections = {
  emergencyCalls: collection(db, 'emergencyCalls'),
  activeCases: collection(db, 'activeCases'),
  chatMessages: collection(db, 'chatMessages'),
  policeLocations: collection(db, 'policeLocations')
};

// Export helper functions
export const addEmergencyCall = async (callData) => {
  try {
    const docRef = await addDoc(collections.emergencyCalls, {
      ...callData,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding emergency call:', error);
    throw error;
  }
};

export const updateCaseStatus = async (caseId, status) => {
  try {
    await setDoc(doc(collections.activeCases, caseId), {
      status: status,
      updated_at: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating case status:', error);
    throw error;
  }
};