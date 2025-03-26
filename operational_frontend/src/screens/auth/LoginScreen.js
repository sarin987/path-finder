import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { API_URL } from '../../config';

const LoginScreen = ({ navigation }) => {
  const [role, setRole] = useState('parent');
  const [phone, setPhone] = useState('+91');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [step, setStep] = useState(1);
  const [idNumber, setIdNumber] = useState(''); // For batch ID or license ID
  const [loginMethod, setLoginMethod] = useState('password'); // Add loginMethod state

  const isOfficialRole = role !== 'parent' && role !== 'user';

  const handleGoogleSignInSuccess = (data) => {
    // Store the JWT token
    // You might want to use AsyncStorage or your preferred storage method
    navigation.replace('Main');
  };

  const handleGoogleSignInError = (error) => {
    Alert.alert('Error', error);
  };

  const validatePhoneNumber = (phoneNumber) => {
    // Basic validation for Indian phone numbers
    const phoneRegex = /^\+91[1-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleSendOtp = async () => {
    if (!validatePhoneNumber(phone)) {
      Alert.alert('Error', 'Please enter a valid Indian phone number with +91 prefix');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      
      if (data.success) {
        setVerificationId(data.sessionInfo);
        setStep(2);
        Alert.alert('Success', 'OTP sent successfully!');
      } else {
        Alert.alert('Error', data.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    }
  };

  const handlePasswordLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/login-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store the token in secure storage
        // await SecureStore.setItemAsync('userToken', data.token);
        Alert.alert('Success', 'Login successful!');
        navigation.replace('Home');
      } else {
        Alert.alert('Error', data.error || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  const handleOtpLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          otp,
          verificationId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store the token in secure storage
        // await SecureStore.setItemAsync('userToken', data.token);
        Alert.alert('Success', 'Login successful!');
        navigation.replace('Home');
      } else {
        Alert.alert('Error', data.error || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  if (loginMethod === 'password' && step === 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number (with +91)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handlePasswordLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setLoginMethod('otp')}>
          <Text style={styles.linkText}>Login with OTP instead</Text>
        </TouchableOpacity>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <GoogleSignInButton
          userType={role}
          onSignInSuccess={handleGoogleSignInSuccess}
          onSignInError={handleGoogleSignInError}
        />

        <View style={styles.registerOptions}>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Register as User</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('ParentRegister')}>
            <Text style={styles.linkText}>Register as Parent</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loginMethod === 'otp' && step === 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Login with OTP</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number (with +91)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
          <Text style={styles.buttonText}>Send OTP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setLoginMethod('password')}>
          <Text style={styles.linkText}>Login with Password instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
      />
      <TouchableOpacity style={styles.button} onPress={handleOtpLogin}>
        <Text style={styles.buttonText}>Verify & Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#757575',
    fontSize: 14,
  },
  registerOptions: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 10,
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
  },
});

export default LoginScreen;
