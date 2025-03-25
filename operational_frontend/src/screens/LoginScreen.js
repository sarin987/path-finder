import React, { useState } from "react";
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
import auth from "@react-native-firebase/auth";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../styles/LoginScreenStyles";

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState("+91");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOtpLogin, setIsOtpLogin] = useState(true);
  const [userType, setUserType] = useState("Normal User");
  const [batchNumber, setBatchNumber] = useState("");
  const [name, setName] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const BACKEND_URL = "http://192.168.14.103:5000"; // Replace with your actual backend URL

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

  const validateForm = () => {
    const phoneError = validatePhoneNumber(phone);
    setPhoneError(phoneError);
    const passwordError = validatePassword(password);
    setPasswordError(passwordError);
    return !(phoneError || passwordError);
  };

  // Send OTP to user's phone number
  const sendOTP = async () => {
    if (!validatePhoneNumber(phone)) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      // Request OTP from Firebase
      const confirmation = await auth().signInWithPhoneNumber(phone);
      setVerificationId(confirmation.verificationId);
      setOtpSent(true);
      Alert.alert("Success", "OTP has been sent to your phone number");
    } catch (error) {
      console.error("OTP Send Error:", error);
      let errorMessage = "Failed to send OTP. Please try again.";
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = "Invalid phone number format.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and login the user
  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }

    if (!verificationId) {
      Alert.alert("Error", "Please request an OTP first");
      return;
    }

    setLoading(true);
    try {
      // Verify OTP with Firebase
      const credential = auth().PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await auth().signInWithCredential(credential);
      const firebaseUid = userCredential.user.uid;

      // Verify with backend
      const response = await axios.post(`${BACKEND_URL}/api/auth/verify`, {
        phone,
        otp,
        verificationId,
        firebaseUid
      });

      const { token, role, lastLocation } = response.data;

      // Store user details
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("role", role);
      await AsyncStorage.setItem("lastLocation", JSON.stringify(lastLocation || {}));
      await AsyncStorage.setItem("phone", phone);

      // Navigate based on role
      if (role === "Normal User") {
        navigation.navigate("Home");
      } else {
        navigation.navigate(`${role}Dashboard`);
      }
    } catch (error) {
      console.error("Login Error:", error);
      let errorMessage = "Failed to login. Please try again.";
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = "Invalid OTP. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Login using Phone Number and Password
  const handleLoginWithPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login-password`, { 
        phone,
        password 
      });

      const { token, role, lastLocation } = response.data;

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("role", role);
      await AsyncStorage.setItem("lastLocation", JSON.stringify(lastLocation || {}));
      await AsyncStorage.setItem("phone", phone);

      if (role === "Normal User") {
        navigation.navigate("Home");
      } else {
        navigation.navigate(`${role}Dashboard`);
      }
    } catch (error) {
      console.error("Password Login Error:", error);
      Alert.alert("Error", "Invalid phone number or password");
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
      const response = await axios.post(`${BACKEND_URL}/api/auth/role-login`, {
        phone,
        batchNumber,
        name,
        role: userType
      });

      const { token, role, lastLocation } = response.data;

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("role", role);
      await AsyncStorage.setItem("lastLocation", JSON.stringify(lastLocation || {}));
      await AsyncStorage.setItem("phone", phone);

      navigation.navigate(`${role}Dashboard`);
    } catch (error) {
      console.error("Role Login Error:", error);
      Alert.alert("Error", "Invalid credentials or unauthorized access");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Login</Text>

      <Text style={styles.label}>Choose Your Role</Text>
      <Picker selectedValue={userType} style={styles.input} onValueChange={(itemValue) => setUserType(itemValue)}>
        <Picker.Item label="Normal User" value="Normal User" />
        <Picker.Item label="Policeman" value="Policeman" />
        <Picker.Item label="Hospital Emergency" value="Hospital Emergency" />
        <Picker.Item label="Ambulance" value="Ambulance" />
      </Picker>

      <Text style={styles.label}>Enter Phone number</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={(text) => setPhone("+91" + text.slice(3))}
        keyboardType="phone-pad"
        maxLength={13}
        editable={!otpSent}
      />
      {phoneError && <Text style={styles.error}>{phoneError}</Text>}

      {userType === "Normal User" && isOtpLogin ? (
        <>
          {!otpSent ? (
            <TouchableOpacity 
              style={styles.signInButton} 
              onPress={sendOTP} 
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Send OTP</Text>}
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.label}>Enter OTP</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity 
                style={styles.signInButton} 
                onPress={handleVerifyOtp} 
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Verify OTP</Text>}
              </TouchableOpacity>
            </>
          )}
        </>
      ) : userType === "Normal User" && !isOtpLogin ? (
        <>
          <Text style={styles.label}>Enter Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {passwordError && <Text style={styles.error}>{passwordError}</Text>}
          <TouchableOpacity 
            style={styles.signInButton} 
            onPress={handleLoginWithPassword} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Login</Text>}
          </TouchableOpacity>
        </>
      ) : null}

      {/* Role-Based Login Inputs */}
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

      {/* Toggle Login Method */}
      {userType === "Normal User" && (
        <TouchableOpacity onPress={() => setIsOtpLogin(!isOtpLogin)}>
          <Text style={styles.linkText}>
            {isOtpLogin ? "Login with Phone and Password" : "Login with OTP"}
          </Text>
        </TouchableOpacity>
      )}

      {isOtpLogin && userType === "Normal User" && (
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

      {userType === "Normal User" && (
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default LoginScreen;
