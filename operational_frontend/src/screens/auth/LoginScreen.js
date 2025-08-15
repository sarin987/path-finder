import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import { buildApiUrl } from '../../utils/urlUtils';
import { logError, logInfo } from '../../utils/logger';
import { ENDPOINTS } from '../../config/apiEndpoints';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// Using default import as required by the library
import Dropdown from 'react-native-element-dropdown';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Firebase and Google SignIn removed

import { colors } from '../../styles/colors';
import api from '../../config/network';
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
  const { colors, isDarkMode } = useTheme();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState('password');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Import Alert from react-native
  const { Alert } = require('react-native');

  const validateInput = () => {
    // Check if phone number is provided and has at least 10 digits
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 10) {
      alert('Error', 'Please enter a valid 10-digit phone number');
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
      alert('Error', 'Password must be at least 6 characters');
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
    return () => {
      if (interval) {clearInterval(interval);}
    };
  }, [resendTimer, setResendTimer]);

  const handleSendOtp = async () => {
    console.log('[OTP] Sending OTP...');
    if (!phone) {
      const errorMsg = 'Please enter your phone number';
      console.warn('[OTP] Validation failed:', errorMsg);
      alert('Error', errorMsg);
      return;
    }

    try {
      console.log('[OTP] Starting OTP send process for phone:', phone);
      setIsOtpLoading(true);

      // Format phone number (remove all non-digit characters)
      const formattedPhone = phone.replace(/\D/g, '');

      console.log('Sending OTP to:', formattedPhone);

      // Call the backend API to send OTP
      const response = await axios.post(api + ENDPOINTS.auth.sendOtp, {
        phone: formattedPhone,
      }, {
        timeout: 10000, // 10 seconds timeout
      });

      if (response.data.success) {
        console.log('[OTP] OTP sent successfully');
        console.log('OTP sent successfully to:', formattedPhone);

        // Show success message
        alert(
        'OTP Sent',
        'A 6-digit OTP has been sent to your phone number.'
      );

      setIsOtpSent(true);
      alert('Success', 'OTP sent successfully');
    } else {
        logError('OTP send failed', {
          phone,
          error: response.data.message || 'No error message',
        });
        alert('Error', response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      logError('Error sending OTP', {
        phone,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      let errorMessage = 'Failed to send OTP. Please try again.';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your internet connection.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many attempts. Please try again later.';
      }

      alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Navigation handled by AuthProvider
    } catch (error) {
      console.error('Login error:', error);
      alert('Error', 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Show a more informative message to the user
      alert(
        'Google Sign-In Coming Soon',
        'We are working on bringing you Google Sign-In. Please use email and password login for now.',
        [
          {
            text: 'OK',
            onPress: () => console.log('User acknowledged Google Sign-In unavailability'),
          },
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
        console.error('Google Sign-In Error:', {
          message: error.message,
          stack: error.stack,
          response: error.response?.data
        });

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
          alert(
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
      console.error('Google Sign In Error:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });

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

      alert('Error', errorMessage);
      return false;
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleLoginAction = async (type) => {
    // Set the appropriate loading state based on login type
    const setLoading = {
      'password': setIsPasswordLoading,
      'otp': setIsOtpLoading,
      'google': setIsGoogleLoading,
    }[type];

    try {
      // Set loading state
      if (setLoading) {setLoading(true);}

      switch(type) {
        case 'password':
          // For password login, just call handleLogin
          await handleLogin();
          return true;

        case 'otp':
          if (!isOtpSent) {
            // Send OTP
            await handleSendOtp();
            return true; // Just sent OTP, don't navigate yet
          } else {
            // Verify OTP and login
            await handleLogin();
            return true;
          }

        case 'google':
          // Handle Google Sign In
          return await handleGoogleSignIn();

        default:
          throw new Error('Invalid login type');
      }

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
            // Try to get error message from response if available
            if (error.response.data?.message) {
              errorMessage = error.response.data.message;
            }
            break;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error. Please check your internet connection.';
      }

      // Only show alert if there's a meaningful error message
      if (errorMessage) {
        alert('Error', errorMessage);
      }

      return false;

    } finally {
      // Reset loading state
      if (setLoading) {setLoading(false);}
    }
  };

  const renderOtpSection = () => (
    <>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="phone"
          size={20}
          color={colors.primary}
          style={styles.inputIcon}
        />
        <TextInput
          style={[
            styles.input,
            isOtpSent && { backgroundColor: colors.gray[50] },
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
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons
            name="numeric"
            size={20}
            color={colors.primary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
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
            styles.loginButton,
            (isOtpLoading || (resendTimer > 0 && !isOtpSent)) && { opacity: 0.7 },
          ]}
          onPress={() => handleLoginAction('otp')}
          disabled={isOtpLoading || (resendTimer > 0 && !isOtpSent)}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={[
              styles.gradientButton,
              { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
            ]}
          >
            {isOtpLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>
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
          <Text style={[styles.hintText, { textAlign: 'center', marginTop: 10 }]}>
            Resend OTP in {resendTimer} seconds
          </Text>
        )}

        {isOtpSent && resendTimer === 0 && (
          <TouchableOpacity
            onPress={handleSendOtp}
            disabled={isOtpLoading}
            style={{ marginTop: 10 }}
          >
            <Text style={[styles.linkText, { textAlign: 'center' }]}>
              Didn't receive OTP? <Text style={{ fontWeight: 'bold' }}>Resend Now</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.switchMethodButton, { marginTop: 20 }]}
        onPress={() => {
          setLoginMethod('password');
          setIsOtpSent(false);
          setOtp('');
          setResendTimer(0);
          // Clear any existing errors
          Alert.alert = (title, message) => console.log(title, message);
        }}
      >
        <Text style={styles.linkText}>
          <MaterialCommunityIcons name="arrow-left" size={14} /> Back to Password Login
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      <AnimatedBackground />
      
      <Image
        source={require('../../assets/images/emergency-bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <LinearGradient
        colors={isDarkMode 
          ? ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.8)'] 
          : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0.95)']
        }
        style={styles.gradientBackground}
      />

      <AnimatedBackground />

      <View style={styles.mainContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.lottieContainer}>
            <LottieView
              source={require('../../assets/animations/emergency.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          </View>
          <Text style={styles.title}>Login Account</Text>
          <Text style={styles.subtitle}>Your Safety, Our Priority</Text>
        </View>

        <View style={styles.formContainer}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              {loginMethod === 'password' ? (
                <>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="email" size={20} color={colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCompleteType="email"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="lock" size={20} color={colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => handleLoginAction('password')}
                    disabled={isPasswordLoading}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      style={styles.gradientButton}
                    >
                      {isPasswordLoading ? (
                        <ActivityIndicator color={colors.white} />
                      ) : (
                        <Text style={styles.buttonText}>Login</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.switchMethodButton}
                    onPress={() => setLoginMethod('otp')}
                  >
                    <Text style={styles.linkText}>Login with OTP instead</Text>
                  </TouchableOpacity>
                </>
              ) : (
                renderOtpSection()
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, isGoogleLoading && { opacity: 0.7 }]}
                onPress={() => handleLoginAction('google')}
                disabled={isGoogleLoading}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="google"
                  size={24}
                  color={colors.white}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>
                  {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                activeOpacity={0.7}
              >
                <Text style={styles.registerText}>
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
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.03,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    marginTop: -100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 0,
  },
  lottieContainer: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'gray',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 12,
  },
  formContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 6,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e4e9f2',
    borderRadius: 12,
    marginBottom: 12,
    height: 50,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  inputIcon: {
    marginRight: 12,
    color: '#007AFF',
    width: 24,
    height: 24,
    alignSelf: 'center',
    textAlign: 'center',
    lineHeight: 24,
  },
  input: {
    flex: 1,
    height: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 0,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    paddingVertical: 0,
  },
  dropdown: {
    flex: 1,
    height: 50,
    borderColor: '#e4e9f2',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e4e9f2',
    borderRadius: 12,
    marginBottom: 12,
    height: 50,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  dropdownIcon: {
    marginRight: 12,
    color: '#007AFF',
    width: 24,
    height: 24,
    alignSelf: 'center',
    textAlign: 'center',
    lineHeight: 24,
  },
  gradientButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e4e9f2',
  },
  dividerText: {
    width: 50,
    textAlign: 'center',
    color: '#8e8e93',
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  googleIcon: {
    marginRight: 12,
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  registerText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  // Add any screen-specific styles here
});

export default LoginScreen;
