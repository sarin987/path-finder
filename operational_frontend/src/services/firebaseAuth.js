import { 
  getAuthInstance, 
  PhoneAuthProvider, 
  signInWithCredential 
} from '../config/firebase';
import { auth } from './firebaseConfig';

// Initialize reCAPTCHA verifier
let recaptchaVerifier = null;

// Function to initialize reCAPTCHA
export const initializeRecaptcha = () => {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new auth.RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
    });
  }
  return recaptchaVerifier;
};

// Function to send OTP
export const sendOTP = async (phoneNumber) => {
  try {
    const auth = getAuthInstance();
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const appVerifier = initializeRecaptcha();
    
    if (!auth) {
      throw new Error('Authentication service is not available');
    }
    
    const confirmationResult = await auth.signInWithPhoneNumber(formattedPhone, appVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error(error.message || 'Failed to send OTP');
  }
};

// Function to verify OTP
export const verifyOTP = async (confirmationResult, otp) => {
  try {
    const auth = getAuthInstance();
    const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
    
    if (!auth) {
      throw new Error('Authentication service is not available');
    }
    
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw new Error(error.message || 'Failed to verify OTP');
  }
};

// Function to get current user
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const auth = getAuthInstance();
    
    if (!auth) {
      return reject(new Error('Authentication service is not available'));
    }
    
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Function to sign out
export const signOut = async () => {
  try {
    const auth = getAuthInstance();
    
    if (!auth) {
      throw new Error('Authentication service is not available');
    }
    
    await auth.signOut();
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};