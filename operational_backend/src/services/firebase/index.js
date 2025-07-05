const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '../../../config/firebaseConfig.json'));

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-project-id.appspot.com'
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error', error);
    process.exit(1);
  }
}

// Export services
const FirebaseChatService = require('./chatService');
const FirebaseStorageService = require('./storageService');

module.exports = {
  admin,
  db: admin.firestore(),
  bucket: admin.storage().bucket(),
  FirebaseChatService,
  FirebaseStorageService
};
