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
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { API_URL } from '../../config';

const ParentRegisterScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [step, setStep] = useState(1); // 1: Initial form, 2: OTP verification

  const handleSendOtp = async () => {
    if (!phone || !name || !email || !password || !childName || !childAge) {
      Alert.alert('Error', 'Please fill in all fields');
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

  const handleGoogleSignInSuccess = (data) => {
    // Store the JWT token
    // You might want to use AsyncStorage or your preferred storage method
    navigation.replace('Main');
  };

  const handleGoogleSignInError = (error) => {
    Alert.alert('Error', error);
  };

  const handleRegister = async () => {
    try {
      // First verify OTP
      const verifyResponse = await fetch(`${API_URL}/auth/verify-otp`, {
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
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyData.success) {
        Alert.alert('Error', 'Invalid OTP');
        return;
      }

      // Then register parent
      const registerResponse = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebase_uid: verifyData.firebase_uid,
          name,
          phone,
          email,
          password,
          role: 'parent',
          child: {
            name: childName,
            age: parseInt(childAge, 10)
          }
        }),
      });

      const registerData = await registerResponse.json();

      if (registerData.success) {
        Alert.alert('Success', 'Registration successful!');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', registerData.error || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  if (step === 1) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Parent Registration</Text>
          
          <Text style={styles.sectionTitle}>Parent Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.sectionTitle}>Child Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Child's Name"
            value={childName}
            onChangeText={setChildName}
          />
          <TextInput
            style={styles.input}
            placeholder="Child's Age"
            value={childAge}
            onChangeText={setChildAge}
            keyboardType="number-pad"
          />

          <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleSignInButton
            userType="parent"
            onSignInSuccess={handleGoogleSignInSuccess}
            onSignInError={handleGoogleSignInError}
          />

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Verify & Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
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
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 15,
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
  },
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
});

export default ParentRegisterScreen;
