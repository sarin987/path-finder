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
import { styles } from "../styles/LoginScreenStyles"; // Custom styles for the screen

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState("+91"); // User's phone number (with +91 default)
  const [password, setPassword] = useState(""); // Password input
  const [otp, setOtp] = useState(""); // OTP input
  const [verificationId, setVerificationId] = useState(""); // To store the verification ID from Firebase
  const [loading, setLoading] = useState(false); // Loading state for UI
  const [isOtpLogin, setIsOtpLogin] = useState(true); // State to toggle between OTP and password login
  const [userType, setUserType] = useState("Normal User"); // Role of the user (Normal User, Police, Hospital, Ambulance)
  const [batchNumber, setBatchNumber] = useState(""); // Batch number for police, hospital, or ambulance driver
  const [name, setName] = useState(""); // Name input for police, hospital, or ambulance driver
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Form validation
  const validatePhoneNumber = (phone) => {
    if (!phone) return "Phone number is required";
    if (phone.length !== 13) return "Phone number must be 13 digits";
    return null;
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    return null;
  };

  const validateForm = () => {
    const phoneError = validatePhoneNumber(phone);
    setPhoneError(phoneError);
    const passwordError = validatePassword(password);
    setPasswordError(passwordError);
    return !(phoneError || passwordError);
  };

  // Verify OTP and login the user
  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      const credential = auth().PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await auth().signInWithCredential(credential);
      const firebaseUid = userCredential.user.uid;

      console.log("Firebase UID:", firebaseUid);
      // Call backend for MySQL verification using the phone number
      const response = await axios.post(`http://192.168.14.103:5000/api/auth/verify`, {
        phone,
        otp,
        verificationId,
      });

      const { token, role, lastLocation } = response.data;

      // Store user details in AsyncStorage
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("role", role);
      await AsyncStorage.setItem("lastLocation", JSON.stringify(lastLocation || {}));

      // Navigate based on role
      if (role === "Normal User") {
        navigation.navigate("Home");
      } else {
        navigation.navigate(`${role}Dashboard`); // Adjust according to role
      }
    } catch (error) {
      console.error("Login Error:", error);
      if (error.code === 'auth/invalid-verification-code') {
        Alert.alert("Error", "Invalid OTP. Please try again.");
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert("Error", "Too many attempts. Please try again later.");
      } else {
        Alert.alert("Error", "Failed to login. Please try again.");
      }
    }
    setLoading(false);
  };

  // Handle Login using Phone Number and Password
  const handleLoginWithPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login-password`, { phone });

      const { dbPassword, token, role, lastLocation } = response.data;

      if (dbPassword === password) {
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("role", role);
        await AsyncStorage.setItem("lastLocation", JSON.stringify(lastLocation || {}));

        if (role === "Normal User") {
          navigation.navigate("Home");
        } else {
          navigation.navigate(`${role}Dashboard`);
        }
      } else {
        Alert.alert("Error", "Invalid password.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to login with phone number and password.");
    }
    setLoading(false);
  };

  // Handle Role-Based Login for Police, Hospital, and Ambulance Drivers
  const handleRoleLogin = async () => {
    if (!batchNumber || !name) {
      Alert.alert("Error", "Please enter both batch number and name.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login-role`, {
        batchNumber,
        name,
        userType,
      });

      const { token, role } = response.data;

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("role", role);

      navigation.navigate(`${role}Dashboard`);
    } catch (error) {
      console.error("Role Login Error:", error);
      Alert.alert("Error", "Invalid batch number or name.");
    }
    setLoading(false);
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!phone) {
      Alert.alert("Error", "Please enter your phone number first.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/forgot-password`, { phone });

      if (response.data.success) {
        Alert.alert("Success", "A password reset link has been sent to your phone.");
      } else {
        Alert.alert("Error", response.data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error sending reset request:", error);
      Alert.alert("Error", "Failed to send password reset request.");
    } finally {
      setLoading(false);
    }
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
        onChangeText={(text) => setPhone("+91" + text.slice(3))} // Allow changes after the "+91"
        keyboardType="phone-pad"
        maxLength={13}
      />
      {phoneError && <Text style={styles.error}>{phoneError}</Text>}

      

      {/* OTP or Password Input */}
      {userType === "Normal User" && isOtpLogin ? (
        <>
          {verificationId && (
            console.log("Verification ID:", verificationId),
            <Text style={styles.label}>Enter OTP</Text>,
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
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

      {/* Login Button */}
      {!isOtpLogin ? (
        <TouchableOpacity style={styles.signInButton} onPress={handleLoginWithPassword} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Login</Text>}
        </TouchableOpacity>
      ) : (
        userType === "Normal User" && (
          <TouchableOpacity style={styles.signInButton} onPress={handleVerifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Verify OTP</Text>}
          </TouchableOpacity>
        )
      )}

      {userType !== "Normal User" && (
        <TouchableOpacity style={styles.signInButton} onPress={handleRoleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Login as {userType}</Text>}
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
