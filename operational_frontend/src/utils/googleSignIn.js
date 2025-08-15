import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

// Configure Google Sign-In
const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: '132352997002-gpv0j05jq4d4m4qteg44tkqn1dv035di.apps.googleusercontent.com', // From google-services.json (client_id with client_type: 1)
    offlineAccess: true, // If you need to access Google APIs on the backend
    forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
    iosClientId: '', // [iOS] optional, if you want to specify the client ID of type iOS (required if used with `iosClientId`)
    googleServicePlistPath: '', // [iOS] optional, if you renamed your GoogleService-Info file
    profileImageSize: 120, // [iOS] The desired width (and height) of the profile image. Defaults to 120px
  });
};

export { configureGoogleSignIn };
