import React, { useState, useEffect } from 'react';
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
import { API_ROUTES } from '../../config';
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
  const [verificationId, setVerificationId] = useState(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '132352997002-191rb761r7moinacu45nn0iso7e7mf88.apps.googleusercontent.com', // Your web client ID from Google Cloud Console
      offlineAccess: true,
    });
  }, []);

  const validateInput = () => {
    if (!phone || !phone.startsWith('+91') || phone.length !== 13) {
      Alert.alert('Error', 'Please enter a valid Indian phone number (+91XXXXXXXXXX)');
      return false;
    }

    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+91[1-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSendOtp = async () => {
    if (!validatePhoneNumber(phone)) {
      Alert.alert('Error', 'Please enter a valid Indian phone number with +91 prefix');
      return;
    }

    try {
      const confirmation = await auth().signInWithPhoneNumber(phone);
      setVerificationId(confirmation.verificationId);
      setIsOtpSent(true);
      Alert.alert('Success', 'OTP sent successfully!');
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
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
        
        const requestBody = {
          phone: phone.replace(/\s+/g, '').trim(),
          password: password.trim()
        };

        console.log('Login request:', requestBody);

        const response = await fetch(`${API_ROUTES.auth}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody),
          // Add timeout
          timeout: 10000 
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Authentication failed');
        }

        // Store user data and update context
        await login({
          id: data.userId,
          role: data.role,
          name: data.name,
          phone: data.phone,
          profile_photo: data.profile_photo,
          gender: data.gender,
          user_verified: data.user_verified,
          token: data.token
        });

        // Use navigation.reset instead of replace
        navigation.reset({
          index: 0,
          routes: [{ 
            name: ROLE_ROUTES[data.role] || 'UserDashboard',
            params: { userData: data }
          }]
        });

        return true;

      } catch (error) {
        console.error('Login Error:', error);
        
        // Check if error is timeout
        if (error.code === 'ETIMEDOUT' && retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying login attempt ${retryCount}...`);
          return attemptLogin();
        }

        Alert.alert(
          'Login Failed', 
          'Connection timed out. Please check your internet connection and try again.'
        );
        return false;
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
      Alert.alert('Error', 'Please enter a valid Indian phone number');
      return false;
    }

    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return false;
    }

    try {
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await auth().signInWithCredential(credential);
      
      const response = await fetch(`${API_ROUTES.auth}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebase_uid: userCredential.user.uid,
          phone: phone.trim()
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      await AsyncStorage.multiSet([
        ['userToken', data.token],
        ['userRole', data.role || 'user'],
        ['userId', data.userId?.toString()],
        ['phone', phone.trim()]
      ]);

      navigation.replace(ROLE_ROUTES[data.role] || 'UserDashboard');
      return true;
    } catch (error) {
      console.error('OTP Login Error:', error);
      Alert.alert('Error', 'OTP verification failed');
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      const response = await fetch(`${API_ROUTES.auth}/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebase_uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName,
          photo_url: userCredential.user.photoURL
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Google sign-in failed');
      }

      await AsyncStorage.multiSet([
        ['userToken', data.token],
        ['userRole', 'user'],
        ['userId', data.userId?.toString()],
        ['email', userCredential.user.email]
      ]);

      navigation.replace('UserDashboard');
      return true;
    } catch (error) {
      console.error('Google Sign In Error:', error);
      Alert.alert('Error', 'Google sign-in failed');
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
          break;
        case 'otp':
          if (!isOtpSent) {
            await handleSendOtp();
            success = true; // Just sent OTP
          } else {
            success = await handleOtpLogin();
          }
          break;
        case 'google':
          success = await handleGoogleSignIn();
          break;
        default:
          throw new Error('Invalid login type');
      }
      
      if (success) {
        if (type === 'password' || (type === 'otp' && isOtpSent)) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'UserDashboard' }]
          });
        }
      }
    } catch (error) {
      console.error(`${type} Login Error:`, error);
      Alert.alert(
        'Login Failed', 
        error.message || 'Please check your credentials and try again'
      );
    } finally {
      if (setLoading) {
        setLoading(false);
      }
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      console.log('Login URL:', `${API_ROUTES.auth}/login`);
      console.log('Request body:', { password, phone });

      const response = await fetch(`${API_ROUTES.auth}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone,
          password
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      const userData = {
        id: data.userId,
        role: data.role,
        name: data.name || 'N/A',
        phone: data.phone,
        profile_photo: data.profile_photo,
        gender: data.gender,
        user_verified: data.user_verified,
        token: data.token
      };

      const loginSuccess = await login(userData);

      if (loginSuccess) {
        navigation.reset({
          index: 0,
          routes: [{ 
            name: ROLE_ROUTES[data.role] || 'UserDashboard',
            params: { userData }
          }]
        });
      } else {
        throw new Error('Failed to store auth data');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
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
          style={authStyles.input}
          placeholder="Phone Number (with +91)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
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
            placeholder="Enter OTP"
            placeholderTextColor={colors.gray[200]}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>
      )}

      <TouchableOpacity 
        style={authStyles.loginButton}
        onPress={() => handleLoginAction('otp')}
        disabled={isOtpLoading}
      >
        
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={authStyles.gradientButton}
        >
          {isOtpLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={authStyles.buttonText}>
              {isOtpSent ? 'Verify OTP' : 'Send OTP'}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={authStyles.switchMethodButton}
        onPress={() => {
          setLoginMethod('password');
          setIsOtpSent(false);
          setOtp('');
          setVerificationId(null);
        }}
      >
        <Text style={authStyles.linkText}>Login with Password instead</Text>
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
