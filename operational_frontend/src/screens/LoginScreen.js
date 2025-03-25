import React, { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../styles/LoginScreenStyles";
import { sendOTP, verifyOTP, initializeRecaptcha } from '../services/firebaseAuth';

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState("+91");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOtpLogin, setIsOtpLogin] = useState(true);
  const [userType, setUserType] = useState("Normal User");
  const [batchNumber, setBatchNumber] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({});
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showOTPInput, setShowOTPInput] = useState(false);

  const BACKEND_URL = "http://localhost:5000";

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    initializeRecaptcha();
  }, []);

  const validatePhoneNumber = (phone) => {
    if (!phone) return "Phone number is required";
    if (phone.length !== 13) return "Phone number must be 13 digits";
    if (!phone.startsWith("+91")) return "Phone number must start with +91";
    return null;
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSendOTP = async () => {
    const phoneError = validatePhoneNumber(phone);
    if (phoneError) {
      setErrors({ phone: phoneError });
      return;
    }

    try {
      setLoading(true);
      const result = await sendOTP(phone);
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
      
      // Store user data
      await AsyncStorage.setItem("phone", phone);
      await AsyncStorage.setItem("role", "Normal User");
      
      // Navigate to home screen
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithPassword = async () => {
    const phoneError = validatePhoneNumber(phone);
    const passwordError = validatePassword(password);
    
    if (phoneError || passwordError) {
      setErrors({ phone: phoneError, password: passwordError });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("role", data.role);
        await AsyncStorage.setItem("lastLocation", JSON.stringify(data.lastLocation || {}));
        await AsyncStorage.setItem("phone", phone);

        if (data.role === "Normal User") {
          navigation.navigate("Home");
        } else {
          navigation.navigate(`${data.role}Dashboard`);
        }
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Invalid phone number or password");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleLogin = async () => {
    if (!batchNumber || !name) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/role-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          batchNumber,
          name,
          role: userType
        }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("role", data.role);
        await AsyncStorage.setItem("lastLocation", JSON.stringify(data.lastLocation || {}));
        await AsyncStorage.setItem("phone", phone);

        navigation.navigate(`${data.role}Dashboard`);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Invalid credentials or unauthorized access");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Login</Text>

      <Text style={styles.label}>Choose Your Role</Text>
      <Picker 
        selectedValue={userType} 
        style={styles.input} 
        onValueChange={(itemValue) => setUserType(itemValue)}
      >
        <Picker.Item label="Normal User" value="Normal User" />
        <Picker.Item label="Policeman" value="Policeman" />
        <Picker.Item label="Hospital Emergency" value="Hospital Emergency" />
        <Picker.Item label="Ambulance" value="Ambulance" />
      </Picker>

      <Text style={styles.label}>Enter Phone number</Text>
      {!showOTPInput ? (
        <>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="Phone Number"
            value={phone}
            onChangeText={(text) => setPhone("+91" + text.slice(3))}
            keyboardType="phone-pad"
            maxLength={13}
            editable={!showOTPInput}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
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
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {userType === "Normal User" && !isOtpLogin && (
        <>
          <Text style={styles.label}>Enter Password</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          <TouchableOpacity 
            style={styles.signInButton} 
            onPress={handleLoginWithPassword} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Login</Text>}
          </TouchableOpacity>
        </>
      )}

      {userType !== "Normal User" && (
        <>
          <Text style={styles.label}>Batch Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Batch Number"
            value={batchNumber}
            onChangeText={setBatchNumber}
          />
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TouchableOpacity 
            style={styles.signInButton} 
            onPress={handleRoleLogin} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Login as {userType}</Text>}
          </TouchableOpacity>
        </>
      )}

      {userType === "Normal User" && (
        <TouchableOpacity onPress={() => setIsOtpLogin(!isOtpLogin)}>
          <Text style={styles.linkText}>
            {isOtpLogin ? "Login with Phone and Password" : "Login with OTP"}
          </Text>
        </TouchableOpacity>
      )}

      {isOtpLogin && userType === "Normal User" && (
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

      {userType === "Normal User" && (
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      )}

      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container" style={{ display: 'none' }}></div>
    </ScrollView>
  );
};

export default LoginScreen;
