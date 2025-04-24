import { PermissionsAndroid, Platform } from 'react-native';

export const requestMicrophonePermission = async () => {
  if (Platform.OS === 'ios') {
    return true; // iOS handles permissions through Info.plist
  }

  try {
    // Check if we already have permission
    const existingPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );

    if (existingPermission) {
      return true;
    }

    // Request permission
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'This app needs access to your microphone for voice commands.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('Permission check failed:', err);
    return false;
  }
};