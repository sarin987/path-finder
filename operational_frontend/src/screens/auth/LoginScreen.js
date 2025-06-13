import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ROUTES } from '../../config';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Dropdown } from 'react-native-element-dropdown';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authStyles } from '../../styles/authStyles';
import { colors } from '../../styles/colors';
import { api } from '../../config/network';
import { ROLES, ROLE_ROUTES } from '../../constants/auth';
import { AnimatedBackground } from '../../components/AnimatedBackground';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const getColor = (path) => {
  try {
    return path.split('.').reduce((obj, key) => obj[key], colors) || colors.primary;
  } catch (error) {
    return colors.primary; // fallback color
  }
};

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('+91');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const validateInput = () => {
    // Check if phone number is provided and has at least 10 digits
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }

    // Format phone number to ensure it's in the correct format for the backend
    // Remove any non-digit characters and ensure it starts with 91
    const formattedPhone = phoneDigits.startsWith('91') ? phoneDigits : `91${phoneDigits}`;
    
    // Update the phone state with the formatted phone number
    if (phone !== formattedPhone) {
      setPhone(formattedPhone);
    }

    // Check if password is provided and meets minimum length requirement
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const validatePhoneNumber = (phone) => {
    // Check if phone number has at least 10 digits
    const phoneDigits = phone.replace(/\D/g, '');
    return phoneDigits.length >= 10;
  };

  // Handle resend OTP timer
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (!validatePhoneNumber(phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setIsOtpLoading(true);
      
      // Format phone number (remove all non-digit characters)
      const formattedPhone = phone.replace(/\D/g, '');
      
      console.log('Sending OTP to:', formattedPhone);
      
      // Call the backend API to send OTP
      const response = await axios.post(API_ROUTES.auth.sendOtp, {
        phone: formattedPhone
      }, {
        timeout: 10000 // 10 seconds timeout
      });
      
      if (response.data.success) {
        console.log('OTP sent successfully to:', formattedPhone);
        
        // Show success message
        Alert.alert(
          'OTP Sent', 
          'A 6-digit OTP has been sent to your phone number.',
          [{ text: 'OK', onPress: () => console.log('User acknowledged OTP sent') }],
          { cancelable: false }
        );
        
        // Update UI state
        setIsOtpSent(true);
        setResendTimer(60); // 60 seconds cooldown
        setOtp(''); // Clear previous OTP if any
        
        // Auto-focus OTP input field
        // Note: You'll need to add a ref to the OTP TextInput and focus it here
        // Example: otpInputRef.current?.focus();
        
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.response) {
        // Handle specific error status codes
        switch (error.response.status) {
          case 400:
            errorMessage = 'Invalid phone number format.';
            break;
          case 429:
            errorMessage = 'Too many attempts. Please try again later.';
            const retryAfter = parseInt(error.response.headers['retry-after']) || 60;
            setResendTimer(retryAfter);
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Request timed out. Please check your internet connection.';
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!validateInput()) {
      return false;
    }

    let retryCount = 0;
    const maxRetries = 2;

    const attemptLogin = async () => {
      try {
        setIsPasswordLoading(true);
        
        const credentials = {
          phone: phone.replace(/\s+/g, '').trim(),
          password: password.trim()
        };

        console.log('Attempting login with:', { ...credentials, password: '***' });
        
        // Call the AuthContext login function
        const loginResult = await login(credentials);
        
        if (loginResult.success) {
          console.log('Login successful, navigating to UserDashboard');
          // Navigation is handled by the AuthContext after successful login
          return true;
        } else {
          throw new Error(loginResult.error || 'Login failed');
        }

      } catch (error) {
        console.error('Login Error:', error);
        
        // Check if error is timeout
        if ((error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') && retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying login attempt ${retryCount}...`);
          return attemptLogin();
        }

        // Extract error message from response if available
        let errorMessage = 'Login failed. Please check your credentials and try again.';
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage = error.response.data?.message || error.message;
          
          // Handle common error status codes
          switch (error.response.status) {
            case 401:
              errorMessage = 'Invalid phone number or password';
              break;
            case 403:
              errorMessage = 'Account is inactive or blocked';
              break;
            case 429:
              errorMessage = 'Too many login attempts. Please try again later.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              break;
          }
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = 'Network error. Please check your internet connection.';
        }
        
        Alert.alert('Login Failed', errorMessage);
        return false;
      } finally {
        setIsPasswordLoading(false);
      }
    };

    try {
      return await attemptLogin();
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    if (!validatePhoneNumber(phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }

    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return false;
    }

    try {
      setIsOtpLoading(true);
      
      // Call the AuthContext login function with OTP credentials
      const loginResult = await login({
        phone: phone.replace(/\D/g, ''), // Remove non-digit characters
        otp: otp.trim()
      });

      if (loginResult.success) {
        console.log('OTP Login successful, navigating to UserDashboard');
        // Clear OTP field after successful login
        setOtp('');
        return true;
      } else {
        throw new Error(loginResult.error || 'Login failed');
      }
    } catch (error) {
      console.error('OTP Login Error:', error);
      
      let errorMessage = 'OTP verification failed. Please try again.';
      
      if (error.response) {
        // Handle specific error status codes
        switch (error.response.status) {
          case 400:
            errorMessage = 'Invalid OTP. Please check and try again.';
            break;
          case 401:
            errorMessage = 'Invalid or expired OTP. Please request a new one.';
            break;
          case 404:
            errorMessage = 'No OTP request found. Please request a new OTP.';
            break;
          case 410:
            errorMessage = 'OTP has expired. Please request a new one.';
            break;
          case 429:
            errorMessage = 'Too many attempts. Please try again later.';
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        // Something happened in setting up the request
        errorMessage = error.message || errorMessage;
      }
      
      // Clear OTP field on error to force user to enter a new one
      setOtp('');
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Show a more informative message to the user
      Alert.alert(
        'Google Sign-In Coming Soon',
        'We are working on bringing you Google Sign-In. Please use phone number and password login for now.',
        [
          {
            text: 'OK',
            onPress: () => console.log('User acknowledged Google Sign-In unavailability')
          }
        ],
        { cancelable: true }
      );
      
      // Log the attempt for analytics
      console.log('Google Sign-In attempt - not yet implemented');
      
      // Return false to indicate sign-in was not completed
      return false;
      
      /*
      // Implementation plan for Google Sign-In:
      // 1. Configure Google Sign-In in your Google Cloud Console
      // 2. Install required packages: @react-native-google-signin/google-signin
      // 3. Set up your backend to handle Google OAuth
      // 4. Uncomment and complete the implementation below
      
      try {
        // Check if Google Play Services is available
        await GoogleSignin.hasPlayServices();
        
        // Show loading state
        setIsGoogleLoading(true);
        
        // Sign in with Google
        const userInfo = await GoogleSignin.signIn();
        
        // Call your backend API to authenticate with Google
        const response = await axios.post(API_ROUTES.auth.google, {
          email: userInfo.user.email,
          name: userInfo.user.name,
          googleId: userInfo.user.id,
          photoUrl: userInfo.user.photo,
          idToken: userInfo.idToken,
          accessToken: userInfo.accessToken
        });
        
        if (response.data.success) {
          // Call the AuthContext login function with the token
          const loginResult = await login({
            email: userInfo.user.email,
            token: response.data.token,
            provider: 'google' // Indicate this is a Google sign-in
          });
          
          if (loginResult.success) {
            console.log('Google Sign-In successful');
            return true;
          } else {
            throw new Error(loginResult.error || 'Google sign-in failed');
          }
        } else {
          throw new Error(response.data.message || 'Google sign-in failed');
        }
      } catch (error) {
        console.error('Google Sign-In Error:', error);
        
        // Handle specific Google Sign-In errors
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          // User cancelled the sign-in flow
          console.log('User cancelled Google Sign-In');
          return false;
        } else if (error.code === statusCodes.IN_PROGRESS) {
          // Operation (e.g., sign in) is in progress already
          console.log('Google Sign-In already in progress');
          return false;
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          // Play services not available or outdated
          Alert.alert(
            'Google Play Services Required',
            'Google Play Services is not available or outdated. Please update Google Play Services and try again.'
          );
        } else {
          // Other errors
          throw error;
        }
      } finally {
        setIsGoogleLoading(false);
      }
      */
    } catch (error) {
      console.error('Google Sign In Error:', error);
      
      let errorMessage = 'Google sign-in is currently not available. Please try another method.';
      
      // Provide more specific error messages when possible
      if (error.code) {
        switch (error.code) {
          case 'SIGN_IN_CANCELLED':
            errorMessage = 'Google Sign-In was cancelled.';
            break;
          case 'IN_PROGRESS':
            errorMessage = 'Google Sign-In is already in progress.';
            break;
          case 'PLAY_SERVICES_NOT_AVAILABLE':
            errorMessage = 'Google Play Services is not available or outdated.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      
      Alert.alert('Error', errorMessage);
      return false;
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleLoginAction = async (type) => {
    const setLoading = {
      'password': setIsPasswordLoading,
      'otp': setIsOtpLoading,
      'google': setIsGoogleLoading
    }[type];

    if (setLoading) {
      setLoading(true);
    }

    try {
      let success = false;
      
      switch(type) {
        case 'password':
          success = await handlePasswordLogin();
          // Navigation is handled by AuthContext after successful login
          break;
          
        case 'otp':
          if (!isOtpSent) {
            // Send OTP
            await handleSendOtp();
            success = true; // Just sent OTP, don't navigate yet
          } else {
            // Verify OTP and login
            success = await handleOtpLogin();
            // Navigation is handled by AuthContext after successful login
          }
          break;
          
        case 'google':
          success = await handleGoogleSignIn();
          // Navigation is handled by AuthContext after successful login
          break;
          
        default:
          throw new Error('Invalid login type');
      }
      
      return success;
      
    } catch (error) {
      console.error(`${type} Login Error:`, error);
      
      // Don't show alert if user cancelled the operation
      if (error.message === 'User cancelled the login process') {
        return false;
      }
      
      // Show appropriate error message
      let errorMessage = error.message || 'An error occurred. Please try again.';
      
      // Handle specific error cases
      if (error.response) {
        // Server responded with error status code
        switch (error.response.status) {
          case 401:
            errorMessage = 'Invalid credentials. Please try again.';
            break;
          case 403:
            errorMessage = 'Account is inactive or blocked. Please contact support.';
            break;
          case 429:
            errorMessage = 'Too many attempts. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            break;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert('Error', errorMessage);
      return false;
      
    } finally {
      if (setLoading) {
        setLoading(false);
      }
    }
  };

  const renderOtpSection = () => (
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
            isOtpSent && { backgroundColor: colors.gray[50] }
          ]}
          placeholder="Phone Number (e.g., 9876543210)"
          placeholderTextColor={colors.gray[400]}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!isOtpSent}
          selectTextOnFocus={!isOtpSent}
        />
      </View>
      
      {isOtpSent && (
        <View style={authStyles.inputContainer}>
          <MaterialCommunityIcons 
            name="numeric" 
            size={20} 
            color={colors.primary}
            style={authStyles.inputIcon} 
          />
          <TextInput
            style={authStyles.input}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor={colors.gray[400]}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus={true}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => handleLoginAction('otp')}
          />
        </View>
      )}

      <View style={{ marginTop: 20 }}>
        <TouchableOpacity 
          style={[
            authStyles.loginButton, 
            (isOtpLoading || (resendTimer > 0 && !isOtpSent)) && { opacity: 0.7 }
          ]}
          onPress={() => handleLoginAction('otp')}
          disabled={isOtpLoading || (resendTimer > 0 && !isOtpSent)}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={[
              authStyles.gradientButton,
              { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }
            ]}
          >
            {isOtpLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={authStyles.buttonText}>
                {isOtpSent 
                  ? 'Verify OTP' 
                  : resendTimer > 0 
                    ? `Resend OTP in ${resendTimer}s`
                    : 'Send OTP'
                }
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {resendTimer > 0 && isOtpSent && (
          <Text style={[authStyles.hintText, { textAlign: 'center', marginTop: 10 }]}>
            Resend OTP in {resendTimer} seconds
          </Text>
        )}

        {isOtpSent && resendTimer === 0 && (
          <TouchableOpacity
            onPress={handleSendOtp}
            disabled={isOtpLoading}
            style={{ marginTop: 10 }}
          >
            <Text style={[authStyles.linkText, { textAlign: 'center' }]}>
              Didn't receive OTP? <Text style={{ fontWeight: 'bold' }}>Resend Now</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[authStyles.switchMethodButton, { marginTop: 20 }]}
        onPress={() => {
          setLoginMethod('password');
          setIsOtpSent(false);
          setOtp('');
          setResendTimer(0);
          // Clear any existing errors
          Alert.alert = (title, message) => console.log(title, message);
        }}
      >
        <Text style={authStyles.linkText}>
          <MaterialCommunityIcons name="arrow-left" size={14} /> Back to Password Login
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle="dark-content"
      />
      
      <Image
        source={require('../../assets/images/emergency-bg.jpg')}
        style={authStyles.backgroundImage}
        resizeMode="cover"
      />
      
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0.95)']}
        style={authStyles.gradientBackground}
      />
      
      <AnimatedBackground />

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
          <Text style={authStyles.title}>Login Account</Text>
          <Text style={authStyles.subtitle}>Your Safety, Our Priority</Text>
        </View>

        <View style={authStyles.formContainer}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              {loginMethod === 'password' ? (
                <>
                  <View style={authStyles.inputContainer}>
                    <MaterialCommunityIcons name="phone" size={20} color={colors.primary} style={authStyles.inputIcon} />
                    <TextInput
                      style={authStyles.input}
                      placeholder="Phone Number"
                      placeholderTextColor={colors.gray[200]}
                      value={phone}
                      onChangeText={(text) => setPhone(text.startsWith('+91') ? text : '+91' + text)}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={authStyles.inputContainer}>
                    <MaterialCommunityIcons name="lock" size={20} color={colors.primary} style={authStyles.inputIcon} />
                    <TextInput
                      style={authStyles.input}
                      placeholder="Password"
                      placeholderTextColor={colors.gray[200]}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity 
                    style={authStyles.loginButton}
                    onPress={() => handleLoginAction('password')}
                    disabled={isPasswordLoading}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      style={authStyles.gradientButton}
                    >
                      {isPasswordLoading ? (
                        <ActivityIndicator color={colors.white} />
                      ) : (
                        <Text style={authStyles.buttonText}>Login</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={authStyles.switchMethodButton}
                    onPress={() => setLoginMethod('otp')}
                  >
                    <Text style={authStyles.linkText}>Login with OTP instead</Text>
                  </TouchableOpacity>
                </>
              ) : (
                renderOtpSection()
              )}

              <View style={authStyles.divider}>
                <View style={authStyles.dividerLine} />
                <Text style={authStyles.dividerText}>OR</Text>
                <View style={authStyles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={[authStyles.googleButton, isGoogleLoading && { opacity: 0.7 }]}
                onPress={() => handleLoginAction('google')}
                disabled={isGoogleLoading}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons 
                  name="google" 
                  size={24} 
                  color={colors.white}
                  style={authStyles.googleIcon} 
                />
                <Text style={authStyles.googleButtonText}>
                  {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={authStyles.registerButton}
                onPress={handleRegister}
                activeOpacity={0.7}
              >
                <Text style={authStyles.registerText}>
                  New User? Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...authStyles.container,
  },
  // Add any screen-specific styles here
});

export default LoginScreen;
