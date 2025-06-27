import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
  ActivityIndicator,
  AsyncStorage,
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Dropdown } from 'react-native-element-dropdown';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { authStyles } from '../../styles/authStyles';
import { colors } from '../../styles/colors';
import LottieView from 'lottie-react-native';
import { logError, logInfo } from '../../utils/logger';
import { AuthAPI } from '../../config/network';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Replace with your actual web client ID
  offlineAccess: true,
});

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' }
];

// Email validation function
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const RegisterScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('+91');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [formData, setFormData] = useState(null);
  const [email, setEmail] = useState('');
  
  // Check if all required fields are filled
  const isFormValid = React.useMemo(() => {
    const phoneNumber = phone.replace(/\D/g, '');
    const isNameValid = name?.trim().length > 0;
    const isPhoneValid = phoneNumber.length >= 10;
    const isPasswordValid = password?.length >= 6;
    const doPasswordsMatch = password === confirmPassword;
    const isGenderValid = gender !== '';
    const isEmailValid = validateEmail(email);
    return isNameValid && isPhoneValid && isPasswordValid && doPasswordsMatch && isGenderValid && isEmailValid;
  }, [name, phone, password, confirmPassword, gender, email]);
  
  // Debug log - remove in production
  if (__DEV__) {
    console.log('Form validation state:', {
      name: name?.trim().length > 0,
      phone: phone.replace(/\D/g, '').length >= 10,
      password: password?.length >= 6,
      passwordsMatch: password === confirmPassword,
      gender: gender !== ''
    });
  }

  useEffect(() => {
    // Add any necessary initialization logic here
  }, []);

  const handleSendOtp = async () => {
    console.log('handleSendOtp called');
    console.log('Form values:', { name, phone, password, confirmPassword, gender });
    
    // Client-side validation
    if (!name || name.trim().length === 0) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    const phoneNumber = phone.replace(/\D/g, '');
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (!gender) {
      Alert.alert('Error', 'Please select your gender');
      return;
    }

    if (!email || !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      logInfo('Sending OTP to', { phone });
      
      // Format phone number if needed
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
      // Save form data for later use after OTP verification
      setFormData({
        name,
        phone: formattedPhone,
        password,
        gender,
        email
      });
      
      // Send OTP to the provided phone number
      const confirmation = await auth().signInWithPhoneNumber(phone);
      setVerificationId(confirmation.verificationId);
      setShowOtpField(true);
      
      // Show OTP input field
      setShowOtpField(true);
      
      // Hide OTP input after 2 minutes
      const otpTimeout = setTimeout(() => {
        if (showOtpField) {
          setShowOtpField(false);
          Alert.alert('Timeout', 'OTP has expired. Please try again.');
        }
      }, 120000);
      
      // Clean up timeout on unmount
      return () => clearTimeout(otpTimeout);
      
      logInfo('OTP sent successfully', { phone: formattedPhone });
      Alert.alert('Success', 'OTP sent successfully!');
    } catch (error) {
      logError('Error sending OTP', {
        phone,
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'Quota exceeded. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const verifyOtp = async (verificationId, otpCode) => {
    try {
      setIsLoading(true);
      logInfo('Verifying OTP', { verificationId: verificationId ? 'provided' : 'missing', otpLength: otpCode?.length });
      
      if (!verificationId || !otpCode) {
        throw new Error('Verification ID or OTP code is missing');
      }
      
      const credential = auth.PhoneAuthProvider.credential(verificationId, otpCode);
      const userCredential = await auth().signInWithCredential(credential);
      
      logInfo('OTP verification successful', { uid: userCredential.user?.uid });
      return { success: true, user: userCredential.user };
    } catch (error) {
      logError('OTP verification failed', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = 'Invalid OTP. Please try again.';
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP. Please enter the correct code.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new one.';
      } else if (error.code === 'auth/credential-already-in-use') {
        errorMessage = 'This OTP has already been used. Please request a new one.';
      }
      
      return { 
        success: false, 
        error: errorMessage,
        code: error.code 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      logInfo('Verifying OTP', { hasVerificationId: !!verificationId, otpLength: otp.length });
      
      if (!verificationId) {
        throw new Error('No verification ID found. Please request a new OTP.');
      }

      // Verify OTP with Firebase
      const { success, user, error: otpError } = await verifyOtp(verificationId, otp);
      
      if (!success || !user) {
        throw new Error(otpError || 'OTP verification failed');
      }

      const firebaseUid = user.uid;
      logInfo('OTP verified successfully', { firebaseUid });

      // Now register with our backend
      const userData = {
        ...formData,
        firebase_uid: firebaseUid,
        role: 'user',
        email
      };

      logInfo('Attempting registration with backend', { 
        ...userData, 
        password: '***' // Don't log password
      });
      
      const { success: registerSuccess, data, error: registerError } = await AuthAPI.register(userData);

      if (registerSuccess) {
        logInfo('Registration successful', { 
          userId: data.id,
          phone: data.phone,
          name: data.name 
        });
        
        // Clear sensitive data
        setPassword('');
        setOtp('');
        setFormData(null);
        
        Alert.alert(
          'Success!',
          'Registration successful! You can now login.',
          [{ 
            text: 'OK', 
            onPress: () => {
              // Clear navigation stack and go to login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }]
        );
      } else {
        throw new Error(registerError || 'Registration failed');
      }
    } catch (error) {
      logError('Registration error', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle specific error cases
      if (error.code === 'auth/network-request-failed' || 
          error.message.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/phone-number-already-exists' || 
                error.message.toLowerCase().includes('taken')) {
        errorMessage = 'This phone number is already registered. Please login instead.';
      } else if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP. Please try again.';
      } else if (error.code === 'auth/session-expired') {
        errorMessage = 'Session expired. Please request a new OTP.';
      } else if (error.message.includes('firebase_uid')) {
        errorMessage = 'Firebase authentication failed. Please try again.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignInSuccess = async () => {
    try {
      setIsLoading(true);
      logInfo('Starting Google sign-in process');
      
      // Check if Google Play Services is available (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      
      // Sign in with Google
      await GoogleSignin.signOut(); // Ensure clean state
      const { idToken } = await GoogleSignin.signIn();
      
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign-in with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      if (!userCredential.user) {
        throw new Error('Failed to authenticate with Google');
      }

      const userData = {
        firebase_uid: userCredential.user.uid,
        name: userCredential.user.displayName || '',
        email: userCredential.user.email || '',
        profile_picture: userCredential.user.photoURL || null,
        auth_provider: 'google',
        phone: userCredential.user.phoneNumber || ''
      };

      logInfo('Sending Google auth data to backend', { 
        email: userData.email,
        uid: userData.firebase_uid 
      });

      // Register/Login with our backend
      const { success, data, error } = await AuthAPI.googleAuth(userData);

      if (success && data?.token) {
        logInfo('Google auth successful', { 
          userId: data.userId,
          name: userData.name 
        });
        
        // Store the auth token
        await AsyncStorage.setItem('authToken', data.token);
        
        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        logError('Google auth failed', {
          email: userData.email,
          error: error || 'Unknown error during Google authentication'
        });
        throw new Error(error || 'Google authentication failed');
      }
    } catch (error) {
      logError('Google sign-in error', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      // Handle specific error cases
      if (error.code === 'auth/account-exists-with-different-credential' ||
          error.message.includes('account-exists')) {
        errorMessage = 'An account already exists with the same email but different sign-in method.';
      } else if (error.code === 'auth/network-request-failed' || 
                error.message.includes('NETWORK_ERROR')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/popup-closed-by-user' ||
                error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign in was cancelled';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid credentials. Please try again.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google sign-in is not enabled. Please contact support.';
      } else if (error.code === 'playServices' || 
                error.message.includes('PLAY_SERVICES_NOT_AVAILABLE')) {
        errorMessage = 'Google Play Services is required for Google Sign-In.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      
      <Image
        source={require('../../assets/images/emergency-bg.jpg')}
        style={authStyles.backgroundImage}
        resizeMode="cover"
      />
      
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0.95)']}
        style={authStyles.gradientBackground}
      />

      <View style={authStyles.mainContainer}>
        <View style={authStyles.logoContainer}>
          <View style={authStyles.lottieContainer}>
            <LottieView
              source={require('../../assets/animations/emergency.json')}
              autoPlay
              loop
              style={authStyles.lottieAnimation}
            />
          </View>
          <Text style={authStyles.title}>Create Account</Text>
          <Text style={authStyles.subtitle}>Join our Emergency Response Network</Text>
        </View>

        <View style={authStyles.formContainer}>
          {!showOtpField ? (
            <>
              <View style={authStyles.inputContainer}>
                <MaterialCommunityIcons 
                  name="phone" 
                  size={20} 
                  color={colors.primary}
                  style={authStyles.inputIcon} 
                />
                <TextInput
                  style={[
                    authStyles.input,
                    phone.replace(/\D/g, '').length < 10 && phone.length > 0 && { borderColor: 'red' }
                  ]}
                  placeholder="Phone Number"
                  placeholderTextColor={colors.gray[200]}
                  value={phone}
                  onChangeText={(text) => {
                    // Only allow numbers and + at start
                    const cleaned = text.replace(/[^\d+]/g, '');
                    // Ensure it starts with +91 and has max 13 characters
                    if (cleaned.startsWith('+')) {
                      if (cleaned.length <= 13) {
                        setPhone(cleaned);
                      }
                    } else if (cleaned.length <= 10) {
                      setPhone('+91' + cleaned);
                    }
                  }}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
                {phone.replace(/\D/g, '').length < 10 && phone.length > 0 && (
                  <MaterialCommunityIcons 
                    name="alert-circle" 
                    size={20} 
                    color="red"
                    style={{ marginLeft: 5 }}
                  />
                )}
              </View>

              <View style={authStyles.inputContainer}>
                <MaterialCommunityIcons 
                  name="account" 
                  size={20} 
                  color={colors.primary}
                  style={authStyles.inputIcon} 
                />
                <TextInput
                  style={authStyles.input}
                  placeholder="Full Name"
                  placeholderTextColor={colors.gray[200]}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={authStyles.inputContainer}>
                <MaterialCommunityIcons 
                  name="email" 
                  size={20} 
                  color={colors.primary}
                  style={authStyles.inputIcon} 
                />
                <TextInput
                  style={authStyles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={authStyles.inputContainer}>
                <MaterialCommunityIcons 
                  name="lock" 
                  size={20} 
                  color={colors.primary}
                  style={authStyles.inputIcon} 
                />
                <TextInput
                  style={[
                    authStyles.input,
                    password && password.length > 0 && password.length < 6 && { borderColor: 'orange' },
                    password && password.length >= 6 && { borderColor: 'green' }
                  ]}
                  placeholder="Password (min 6 characters)"
                  placeholderTextColor={colors.gray[200]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                {password && password.length > 0 && password.length < 6 && (
                  <MaterialCommunityIcons 
                    name="alert" 
                    size={20} 
                    color="orange"
                    style={{ marginLeft: 5 }}
                  />
                )}
                {password && password.length >= 6 && (
                  <MaterialCommunityIcons 
                    name="check-circle" 
                    size={20} 
                    color="green"
                    style={{ marginLeft: 5 }}
                  />
                )}
              </View>
              
              <View style={authStyles.inputContainer}>
                <MaterialCommunityIcons 
                  name="lock-check" 
                  size={20} 
                  color={colors.primary}
                  style={authStyles.inputIcon} 
                />
                <TextInput
                  style={[
                    authStyles.input,
                    confirmPassword && confirmPassword.length > 0 && {
                      borderColor: password === confirmPassword ? 'green' : 'red'
                    }
                  ]}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.gray[200]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                {confirmPassword && confirmPassword.length > 0 && (
                  <MaterialCommunityIcons 
                    name={password === confirmPassword ? 'check-circle' : 'alert-circle'}
                    size={20} 
                    color={password === confirmPassword ? 'green' : 'red'}
                    style={{ marginLeft: 5 }}
                  />
                )}
              </View>

              <View style={authStyles.dropdownContainer}>
                <MaterialCommunityIcons 
                  name="gender-male-female" 
                  size={20} 
                  color={colors.primary}
                  style={authStyles.dropdownIcon} 
                />
                <Dropdown
                  style={[authStyles.dropdown, isFocus && { borderColor: colors.primary }]}
                  placeholderStyle={authStyles.placeholderStyle}
                  selectedTextStyle={authStyles.selectedTextStyle}
                  data={GENDER_OPTIONS}
                  labelField="label"
                  valueField="value"
                  placeholder={!isFocus ? 'Select Gender' : '...'}
                  value={gender}
                  onFocus={() => setIsFocus(true)}
                  onBlur={() => setIsFocus(false)}
                  onChange={item => {
                    setGender(item.value);
                    setIsFocus(false);
                  }}
                  renderLeftIcon={() => null}
                />
              </View>

              <TouchableOpacity 
                style={[
                  authStyles.loginButton, 
                  (!isFormValid || isLoading) && { opacity: 0.5 }
                ]}
                onPress={handleSendOtp}
                disabled={!isFormValid || isLoading}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={authStyles.gradientButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={authStyles.buttonText}>Send OTP</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={authStyles.inputContainer}>
                <MaterialCommunityIcons 
                  name="lock" 
                  size={20} 
                  color={colors.primary}
                  style={authStyles.inputIcon} 
                />
                <TextInput
                  style={authStyles.input}
                  placeholder="Enter OTP"
                  placeholderTextColor={colors.gray[200]}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              
              <TouchableOpacity 
                style={[authStyles.loginButton, { marginTop: 10 }]}
                onPress={handleVerifyOtp}
                disabled={isLoading || otp.length < 6}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={authStyles.gradientButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={authStyles.buttonText}>Verify & Register</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          <View style={authStyles.divider}>
            <View style={authStyles.dividerLine} />
            <Text style={authStyles.dividerText}>OR</Text>
            <View style={authStyles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={[authStyles.googleButton, isLoading && { opacity: 0.7 }]}
            onPress={handleGoogleSignInSuccess}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name="google" 
              size={24} 
              color={colors.white}
              style={authStyles.googleIcon} 
            />
            <Text style={authStyles.googleButtonText}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={authStyles.registerButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={authStyles.registerText}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default RegisterScreen;
