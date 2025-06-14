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
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { Dropdown } from 'react-native-element-dropdown';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { authStyles } from '../../styles/authStyles';
import { colors } from '../../styles/colors';
import LottieView from 'lottie-react-native';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' }
];

const RegisterScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('+91');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocus, setIsFocus] = useState(false);

  useEffect(() => {
    // Add any necessary initialization logic here
  }, []);

  const handleSendOtp = async () => {
    if (!phone || phone.length <= 3) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return;
    }

    try {
      setIsLoading(true);
      const confirmation = await auth().signInWithPhoneNumber(phone);
      setVerificationId(confirmation.verificationId);
      setStep(2);
      Alert.alert('Success', 'OTP sent successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !phone || !password || !gender || !otp || !verificationId) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await auth().signInWithCredential(credential);

      const firebaseUid = userCredential.user.uid;

      const userData = {
        firebase_uid: firebaseUid,
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim(),
        gender: gender.toLowerCase(),
        email: `${phone.replace('+91', '')}@example.com`,
        user_verified: 1
      };

      const registerResponse = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const rawResponse = await registerResponse.text();
      let responseData;
      try {
        responseData = JSON.parse(rawResponse);

        if (responseData.success) {
          Alert.alert(
            'Success',
            'Registration successful!',
            [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
          );
        } else {
          throw new Error(responseData.error || 'Registration failed');
        }
      } catch (parseError) {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Registration failed. Please try again.\n' + 
        (error.message || 'Unknown error occurred')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignInSuccess = async () => {
    try {
      setIsLoading(true);
      const userInfo = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);

      const userData = {
        firebase_uid: userCredential.user.uid,
        name: userCredential.user.displayName,
        email: userCredential.user.email,
        profile_picture: userCredential.user.photoURL,
        role: 'user',
        auth_provider: 'google'
      };

      const response = await fetch(`${API_URL}/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (result.success) {
        await AsyncStorage.setItem('authToken', result.token);
        navigation.replace('Main');
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Google sign-in failed. Please check your internet connection and try again.'
      );
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
          {step === 1 ? (
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
                  placeholder="Phone Number"
                  placeholderTextColor={colors.gray[200]}
                  value={phone}
                  onChangeText={(text) => setPhone(text.startsWith('+91') ? text : '+91' + text)}
                  keyboardType="phone-pad"
                />
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
                  name="lock" 
                  size={20} 
                  color={colors.primary}
                  style={authStyles.inputIcon} 
                />
                <TextInput
                  style={authStyles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.gray[200]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
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
                style={authStyles.loginButton}
                onPress={handleSendOtp}
                disabled={isLoading}
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

              <TouchableOpacity 
                style={authStyles.loginButton}
                onPress={handleRegister}
                disabled={isLoading}
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
