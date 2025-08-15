// Import the Firebase Admin SDK
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if it hasn't been initialized already
let bucket: any = null;
let auth: any = null;
let firebaseAdmin: any = null;

try {
  // Check if Firebase Admin is already initialized
  if (admin.apps.length === 0) {
    // Check if we have the required environment variables
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY ? 
        process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
      universe_domain: 'googleapis.com'
    };

    if (serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
      // Initialize Firebase Admin with the service account
      const app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
      });
      
      firebaseAdmin = admin;
      
      // Initialize Firebase services
      if (app) {
        console.log('Firebase Admin initialized successfully');
        
        // Initialize Storage
        if (process.env.FIREBASE_STORAGE_BUCKET) {
          bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
          console.log(`Firebase Storage bucket configured: ${process.env.FIREBASE_STORAGE_BUCKET}`);
        } else {
          console.warn('No Firebase Storage bucket configured. File uploads will be disabled.');
        }
        
        // Initialize Auth
        auth = admin.auth();
      }
    } else {
      console.warn('Firebase Admin not initialized. Missing required environment variables.');
      console.warn('Required environment variables:');
      console.warn('- FIREBASE_PROJECT_ID');
      console.warn('- FIREBASE_CLIENT_EMAIL');
      console.warn('- FIREBASE_PRIVATE_KEY');
      console.warn('Optional environment variables:');
      console.warn('- FIREBASE_STORAGE_BUCKET (required for file uploads)');
    }
  } else {
    // Use existing app if already initialized
    firebaseAdmin = admin;
    bucket = admin.storage().bucket();
    auth = admin.auth();
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  // Don't exit the process, let the application continue without Firebase
  console.warn('Continuing without Firebase features...');
}

export { firebaseAdmin as admin, bucket, auth };
