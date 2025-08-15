import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  PixelRatio,
  Platform,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Dropdown } from 'react-native-element-dropdown';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import auth from '@react-native-firebase/auth';
import { AnimatedBackground } from '../../components/AnimatedBackground';
import { useTheme } from '../../context/ThemeContext';
import '../../config/firebase';
import { logInfo, logError } from '../../utils/logger';
import colors from '../../styles/colors';



// Screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Scale factors
const scale = SCREEN_WIDTH / 375;
const verticalScale = SCREEN_HEIGHT / 812;

// Normalize function for responsive design
const normalize = (size) => {
  const newSize = size * scale;
  return Platform.OS === 'ios' 
    ? Math.round(PixelRatio.roundToNearestPixel(newSize))
    : Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

// Gender options for dropdown
const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

// Email validation function
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const RegisterScreen = () => {
  const navigation = useNavigation();
  
  // Form state
  const [phone, setPhone] = useState('+91');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form validation
  const isFormValid = (
    phone.length >= 10 &&
    name.trim().length >= 3 &&
    validateEmail(email) &&
    password.length >= 6 &&
    password === confirmPassword &&
    gender
  );

  // Set up an auth state change handler
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      if (user) {
        logInfo('User is signed in:', user.uid);
      }
    });
    
    return () => subscriber(); // Unsubscribe on unmount
  }, []);

  // Handle registration form submission
  const handleRegister = async () => {
    if (!isFormValid) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Navigate to OTP verification screen with user data
      navigation.navigate('VerifyOtp', {
        phone: phone.startsWith('+') ? phone : `+91${phone}`,
        userData: {
          name,
          email,
          phone: phone.startsWith('+') ? phone : `+91${phone}`,
          gender,
          password, // Note: In a production app, you should handle the password securely
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to proceed with registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (userData) => {
    try {
      // Here you would typically send the user data to your backend
      console.log('Registering user:', {
        ...userData,
        password: '***' // Don't log the actual password
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to home screen on successful registration
      navigation.replace('Home');
      
    } catch (error) {
      console.error('Registration error:', error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  const renderForm = () => (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoContainer}>
        <View style={styles.lottieContainer}>
          <LottieView
            source={require('../../assets/animations/emergency.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Your Safety, Our Priority</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Name Input */}
        <View style={styles.inputContainer}>
          <Icon name="account" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={colors.gray[400]}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.gray[400]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <Icon name="phone" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor={colors.gray[400]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Gender Dropdown */}
        <View style={[styles.inputContainer, { zIndex: 1000 }]}>
          <Icon name="gender-male-female" size={20} color={colors.primary} style={styles.inputIcon} />
          <Dropdown
            style={[styles.dropdown, isFocus && { borderColor: colors.primary }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={GENDER_OPTIONS}
            maxHeight={200}
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

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.gray[400]}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.passwordToggle}
          >
            <Icon 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color={colors.gray[400]} 
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Icon name="lock-check" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={colors.gray[400]}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.passwordToggle}
          >
            <Icon 
              name={showConfirmPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color={colors.gray[400]} 
            />
          </TouchableOpacity>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.button, !isFormValid && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={!isFormValid || isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.gradientButton}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // Wrapper component for ScrollView to avoid nesting VirtualizedLists
  const Wrapper = ({ children }) => {
    return Platform.OS === 'ios' ? (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    ) : (
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  };

  const { colors: themeColors } = useTheme();
  
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AnimatedBackground />
      <Wrapper>
        <View style={styles.contentContainer}>
          {renderForm()}
        </View>
        {/* Hidden container for reCAPTCHA */}
        <View 
          id="recaptcha-container" 
          style={{ 
            position: 'absolute',
            left: -9999,
            opacity: 0,
            width: 1,
            height: 1,
            overflow: 'hidden'
          }} 
        />
      </Wrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    margin: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 0,
    width: '100%',
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 20,
  },
  formContainer: {
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: normalize(16),
  },
  dropdown: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
  },
  placeholderStyle: {
    fontSize: normalize(16),
    color: colors.gray[400],
  },
  selectedTextStyle: {
    fontSize: normalize(16),
    color: colors.text,
  },
  passwordToggle: {
    padding: 5,
  },
  button: {
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: colors.gray[600],
    fontSize: normalize(14),
  },
  loginLink: {
    color: colors.primary,
    fontSize: normalize(14),
    fontWeight: '600',
  },
  animationPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RegisterScreen;
