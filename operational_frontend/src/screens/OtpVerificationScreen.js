import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { buildApiUrl } from '../utils/urlUtils';
import { ENDPOINTS } from '../config/apiEndpoints';
import { logError, logInfo } from '../utils/logger';
import { styles } from '../styles/RegisterScreenStyles';

const OtpVerificationScreen = ({ route, navigation }) => {
  const { verificationId, name, phone, password, gender } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async () => {
    console.log('[OTP Verification] Starting OTP verification process');
    console.log('[OTP Verification] Verification ID:', verificationId);
    console.log('[OTP Verification] OTP entered:', otp);

    if (!otp) {
      console.error('[OTP Verification] Error: OTP is empty');
      alert('Please enter the OTP.');
      return;
    }

    setLoading(true);

    try {
      console.log('[OTP Verification] Creating credential with verification ID and OTP');
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
      console.log('[OTP Verification] Credential created, signing in...');

      const userCredential = await auth().signInWithCredential(credential);
      console.log('[OTP Verification] Firebase sign-in successful, UID:', userCredential.user?.uid);

      if (userCredential.user) {
        // Get the Firebase UID after successful OTP verification

        // Prepare API request data
        const requestData = {
          otp,
          phone,
        };

        logInfo('Sending OTP verification', {
          url: verificationUrl,
          data: { ...requestData, otp: '***' }, // Don't log actual OTP
        });

        // Send verification request
        const response = await axios.post(verificationUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 second timeout
        });

        console.log('[OTP Verification] Backend response:', {
          status: response.status,
          data: response.data,
        });

        if (response.data.success) {
          alert('Success', 'OTP verified successfully. Registration completed.');
          navigation.navigate('Login'); // Redirect to login page after successful verification
        } else {
          alert('Error: ' + response.data.error);
        }
      } else {
        alert('OTP verification failed.');
      }
    } catch (error) {
      // Log the error with detailed information
      logError('OTP Verification Error', {
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
        stack: error.stack,
      });

      // Determine user-friendly error message
      let errorMessage = 'Failed to verify OTP. Please try again.';

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (error.response) {
        // Server responded with an error status code
        const { status, data } = error.response;

        if (status === 400) {
          errorMessage = data?.message || 'Invalid request. Please check your OTP and try again.';
        } else if (status === 401) {
          errorMessage = 'Session expired. Please request a new OTP.';
        } else if (status === 404) {
          errorMessage = 'Verification endpoint not found. Please contact support.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // No response received
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }

      // Show error alert
      alert('Verification Failed', errorMessage);
    } finally {
      console.log('[OTP Verification] Verification process completed');
      setLoading(false);
    }
  };




  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Enter OTP</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default OtpVerificationScreen;
