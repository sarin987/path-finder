import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { sendOTP, verifyOTP, initializeRecaptcha } from '../services/firebaseAuth';
import { styles } from '../styles/RegisterScreenStyles';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '+91',
    password: '',
    role: 'Normal User',
    gender: 'Male'
  });
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    initializeRecaptcha();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length !== 13) {
      newErrors.phone = 'Phone number must be 13 digits';
    } else if (!formData.phone.startsWith('+91')) {
      newErrors.phone = 'Phone number must start with +91';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors before proceeding');
      return;
    }

    try {
      setLoading(true);
      const result = await sendOTP(formData.phone);
      setConfirmationResult(result);
      setShowOTPInput(true);
      Alert.alert('Success', 'OTP sent successfully!');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    try {
      setLoading(true);
      const user = await verifyOTP(confirmationResult, otp);
      
      // Register with backend
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          firebase_uid: user.uid
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Registration successful!');
        navigation.navigate('Login');
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register</Text>
      
      {!showOTPInput ? (
        <>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="Phone Number"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: '+91' + text.slice(3) })}
            keyboardType="phone-pad"
            maxLength={13}
            editable={!showOTPInput}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TouchableOpacity 
            style={styles.button}
            onPress={handleSendOTP}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : 'Send OTP'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity 
            style={styles.button}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Verifying...' : 'Verify OTP & Register'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>

      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container" style={{ display: 'none' }}></div>
    </ScrollView>
  );
};

export default RegisterScreen;
