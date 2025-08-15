import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: '132352997002-191rb761r7moinacu45nn0iso7e7mf88.apps.googleusercontent.com', // Get this from Google Cloud Console
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
};
