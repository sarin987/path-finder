import React, { useState, useEffect } from 'react';
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
    return () => clearInterval(interval);
  }, [resendTimer]);

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
      const response = await axios.post(API_ROUTES.auth.sendOtp, {
        phone: formattedPhone
      }, {
        timeout: 10000 // 10 seconds timeout
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
          error: response.data.message || 'No error message'
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
    if (!phone || !password) {
      alert('Error', 'Please enter both phone number and password');
      return;
    }

    setLoading(true);
    try {
      const credentials = { 
        phone: phone.replace(/\D/g, ''), // Remove any non-digit characters
        password 
      };

      logInfo('Attempting user login', { phone: credentials.phone, method: 'Password' });
      
      // Use the new user-specific login endpoint
      const url = buildApiUrl('user/auth/login');
      console.log('Sending login request to:', url);
      console.log('Request payload:', credentials);
      
      const response = await axios.post(
        url,
        credentials,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000,
          withCredentials: true // Important for CORS with credentials
        }
      );
      
      console.log('Login response status:', response.status);
      console.log('Login response data:', response.data);
      
      if (response.data && response.data.token) {
        logInfo('Login successful', { 
          phone: credentials.phone,
          userId: response.data.user?.id
        });
        
        // Extract token and user data from the response
        const { token, user: userData } = response.data;
        
        // Store the token if it exists in the response
        if (token) {
          // Store the auth token for API usage
          await AsyncStorage.setItem('token', token);
          
          // Prepare user data for AuthContext
          const authData = {
            token,
            ...userData,
            phone: userData.phone || credentials.phone,
            id: userData.id,
            role: userData.role || 'user',
            email: userData.email || ''
          };
          
          console.log('Auth data prepared:', authData);
          
          // Store user data in AsyncStorage
          try {
            await AsyncStorage.setItem('userData', JSON.stringify({
              id: authData.id,
              name: authData.name,
              email: authData.email,
              phone: authData.phone,
              role: authData.role,
              avatar: authData.avatar
            }));
          } catch (e) {
            console.warn('Failed to store user data:', e);
          }
          
          // Call the login function from AuthContext with the token and user data
          if (login) {
            // Format the data as expected by the AuthContext
            const loginData = {
              token,
              ...userData,
              // Ensure required fields are present
              phone: userData.phone || credentials.phone,
              id: userData.id,
              role: userData.role || 'user',
              email: userData.email || ''
            };
            
            console.log('Calling AuthContext login with:', loginData);
            await login(loginData);
            
            // Navigate to UserDashboard after successful login
            navigation.navigate('Main', { screen: 'UserDashboard' });
          } else {
            console.error('Login function from AuthContext is not available');
            // Fallback navigation if AuthContext is not available
            navigation.navigate('Home');
          }
        } else {
          // Log the full response for debugging
          console.error('No token in response:', response.data);
          throw new Error('No authentication token received from server');
        }
      } else {
        const errorMessage = response.data?.message || 'Login failed';
        logError('Login failed', {
          phone: credentials.phone,
          error: errorMessage,
        });
        alert('Error', errorMessage);
      }
    } catch (error) {
      // Log the error details
      const errorDetails = {
        phone,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack,
        responseData: error.response?.data
      };
      
      logError('Login error', errorDetails);
      
      // Determine user-friendly error message
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message === 'No authentication token received from server') {
        errorMessage = 'Authentication error. Please try again or contact support.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your internet connection.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid credentials. Please try again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Account not verified. Please verify your account first.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Service not found. Please check your connection or try again later.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!error.response) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      // Clear any invalid tokens
      try {
        const currentToken = await AsyncStorage.getItem('userToken');
        if (!currentToken) {
          await AsyncStorage.removeItem('userToken');
        }
      } catch (storageError) {
        console.error('Error clearing invalid token:', storageError);
      }
      
      // Show error to user
      alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Show a more informative message to the user
      alert(
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
        response: error.response?.data
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
      'google': setIsGoogleLoading
    }[type];

    try {
      // Set loading state
      if (setLoading) setLoading(true);
      
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
      if (setLoading) setLoading(false);
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
