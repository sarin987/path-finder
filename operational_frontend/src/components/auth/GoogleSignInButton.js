import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { API_URL } from '../../config';

// Initialize Google Sign-In
GoogleSignin.configure({
  webClientId: '132352997002-191rb761r7moinacu45nn0iso7e7mf88.apps.googleusercontent.com', // Replace with your Web Client ID from Google Cloud Console
  offlineAccess: true,
});

const GoogleSignInButton = ({ userType, onSignInSuccess, onSignInError }) => {
  const handleGoogleSignIn = async () => {
    try {
      // Start Google Sign-In flow
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // Get the ID token
      const { accessToken } = await GoogleSignin.getTokens();
      
      // Send token to your backend
      const response = await axios.post(`${API_URL}/api/auth/google`, {
        token: accessToken,
        userType: userType // 'normal' or 'parent'
      });
      
      if (response.data.success) {
        // Store the JWT token
        // You might want to use AsyncStorage or your preferred storage method
        onSignInSuccess(response.data);
      } else {
        onSignInError('Google sign-in failed');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        onSignInError('Sign in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        onSignInError('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        onSignInError('Play services not available');
      } else {
        onSignInError('Something went wrong');
      }
    }
  };

  return (
    <TouchableOpacity
      style={styles.googleButton}
      onPress={handleGoogleSignIn}
      activeOpacity={0.7}
    >
      <Text style={styles.googleIcon}>G</Text>
      <Text style={styles.buttonText}>Continue with Google</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoogleSignInButton;
