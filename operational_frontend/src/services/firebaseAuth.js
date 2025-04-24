import { auth, PhoneAuthProvider } from './firebaseConfig';

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
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const appVerifier = initializeRecaptcha();
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
    const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
    const userCredential = await auth.signInWithCredential(credential);
    return userCredential.user;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw new Error(error.message || 'Failed to verify OTP');
  }
};

// Function to get current user
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Function to sign out
export const signOut = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}; 