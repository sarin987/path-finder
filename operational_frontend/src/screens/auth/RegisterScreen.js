import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar, SafeAreaView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Dropdown } from 'react-native-element-dropdown';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import colors from '../../styles/colors';

// Gender options for dropdown
const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { register } = useAuth();
  const theme = useTheme() || {};
  
  // Refs for input fields
  const nameInput = useRef(null);
  const phoneInput = useRef(null);
  const passwordInput = useRef(null);
  const confirmPasswordInput = useRef(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Theme colors with fallback to light theme if theme context is not available
  const isDarkMode = theme?.mode === 'dark' || false;
  const themeColors = {
    background: theme?.colors?.background || '#f5f5f5',
    card: theme?.colors?.card || '#ffffff',
    text: theme?.colors?.text || '#333333',
    border: theme?.colors?.border || '#e0e0e0',
    inputBackground: theme?.colors?.card || '#ffffff',
    placeholder: theme?.colors?.textSecondary || '#666666',
  };

  // Form validation
  const isFormValid = (
    email.includes('@') &&
    email.includes('.') &&
    phone.length >= 10 &&
    name.trim().length >= 3 &&
    password.length >= 8 &&
    password === confirmPassword &&
    gender
  );

  // Format phone number as user types
  const handlePhoneChange = (text) => {
    // Only allow numbers and limit to 10 digits
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
  };

  // Handle registration form submission
  const handleRegister = async () => {
    if (!isFormValid) {
      Alert.alert('Error', 'Please fill in all required fields correctly');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Format phone number (remove all non-digit characters)
      const formattedPhone = phone.replace(/\D/g, '');
      
      // Prepare user data with all required fields
      const userData = {
        email: email.trim().toLowerCase(),
        phone: formattedPhone,
        name: name.trim(),
        password: password,
        gender,
      };
      
      // Call the register function from your auth context
      await register(userData);
      
      // Navigate to OTP verification or home screen
      navigation.navigate('OtpVerification', { phone: formattedPhone });
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of the component...
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={100}
        enableAutomaticScroll={Platform.OS === 'ios'}
        keyboardOpeningTime={0}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <LottieView
            source={require('../../assets/animations/emergency.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={[styles.title, { color: themeColors.text }]}>Emergency Connect</Text>
          <Text style={[styles.subtitle, { color: themeColors.placeholder }]}>Your Safety, Our Priority</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.formTitle, { color: themeColors.text }]}>Create Account</Text>
          <Text style={[styles.formSubtitle, { color: themeColors.placeholder }]}>
            Sign up to get started
          </Text>

          {/* Email Input */}
          <View style={[
            styles.inputContainer,
            { 
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.border
            }
          ]}>
            <Icon name="email" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[
                styles.input,
                { color: themeColors.text }
              ]}
              placeholder="Email Address"
              placeholderTextColor={themeColors.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => nameInput.current?.focus()}
            />
          </View>

          {/* Name Input */}
          <View style={[
            styles.inputContainer,
            { 
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.border
            }
          ]}>
            <Icon name="account" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              ref={nameInput}
              style={[
                styles.input,
                { color: themeColors.text }
              ]}
              placeholder="Full Name"
              placeholderTextColor={themeColors.placeholder}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => phoneInput.current?.focus()}
            />
          </View>

          {/* Phone Input */}
          <View style={[
            styles.inputContainer,
            { 
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.border
            }
          ]}>
            <Icon name="phone" size={20} color={colors.primary} style={styles.inputIcon} />
            <View style={styles.phoneInputContainer}>
              <Text style={[styles.countryCode, { color: themeColors.text }]}>+91</Text>
              <TextInput
                ref={phoneInput}
                style={[
                  styles.input, 
                  styles.phoneInput,
                  { color: themeColors.text }
                ]}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor={themeColors.placeholder}
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={10}
                autoComplete="tel"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordInput.current?.focus()}
              />
            </View>
          </View>

          {/* Gender Dropdown */}
          <View style={[
            styles.inputContainer,
            { 
              backgroundColor: themeColors.inputBackground,
              borderColor: isFocus ? colors.primary : themeColors.border,
              zIndex: 1000
            }
          ]}>
            <Icon name="gender-male-female" size={20} color={colors.primary} style={styles.inputIcon} />
            <Dropdown
              style={[
                styles.dropdown,
                { borderColor: 'transparent' }
              ]}
              placeholderStyle={[
                styles.placeholderStyle,
                { color: themeColors.placeholder }
              ]}
              selectedTextStyle={[
                styles.selectedTextStyle,
                { color: themeColors.text }
              ]}
              data={GENDER_OPTIONS}
              maxHeight={200}
              labelField="label"
              valueField="value"
              placeholder="Select Gender"
              value={gender}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={item => {
                setGender(item.value);
                setIsFocus(false);
              }}
              containerStyle={[
                styles.dropdownContainer,
                { 
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border
                }
              ]}
              itemTextStyle={[
                styles.itemTextStyle,
                { color: themeColors.text }
              ]}
              itemContainerStyle={[
                styles.itemContainerStyle,
                { backgroundColor: themeColors.card }
              ]}
              activeColor={isDarkMode ? '#2a2a2a' : '#f5f5f5'}
            />
          </View>

          {/* Password Input */}
          <View style={[
            styles.inputContainer,
            { 
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.border
            }
          ]}>
            <Icon name="lock" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              ref={passwordInput}
              style={[
                styles.input,
                { color: themeColors.text }
              ]}
              placeholder="Password"
              placeholderTextColor={themeColors.placeholder}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => confirmPasswordInput.current?.focus()}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              <Icon
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.gray[500]}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={[
            styles.inputContainer,
            { 
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.border
            }
          ]}>
            <Icon name="lock-check" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              ref={confirmPasswordInput}
              style={[
                styles.input,
                { color: themeColors.text }
              ]}
              placeholder="Confirm Password"
              placeholderTextColor={themeColors.placeholder}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.passwordToggle}
            >
              <Icon
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.gray[500]}
              />
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, !isFormValid && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isDarkMode ? ['#4c669f', '#3b5998', '#192f6a'] : ['#4c669f', '#3b5998', '#192f6a']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={[styles.loginContainer, { marginTop: 20 }]}>
            <Text style={[styles.loginText, { color: themeColors.text }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  lottie: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  formContainer: {
    marginTop: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  formSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countryCode: {
    fontSize: 16,
    marginRight: 5,
  },
  phoneInput: {
    paddingLeft: 5,
  },
  dropdown: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  dropdownContainer: {
    marginTop: 35,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  itemTextStyle: {
    fontSize: 16,
  },
  itemContainerStyle: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  passwordToggle: {
    padding: 8,
  },
  buttonContainer: {
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  button: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
