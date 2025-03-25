import React, { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  View,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import auth from "@react-native-firebase/auth";
import axios from "axios";
import { styles } from "../styles/RegisterScreenStyles";

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "+91",
    password: "",
    confirmPassword: "",
    role: "Normal User",
    gender: "Male",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const BACKEND_URL = "http://192.168.14.103:5000";

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (formData.phone.length !== 13) {
      newErrors.phone = "Phone number must be 13 digits";
    } else if (!formData.phone.startsWith("+91")) {
      newErrors.phone = "Phone number must start with +91";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const sendOTP = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Please fix the errors before proceeding");
      return;
    }

    setLoading(true);
    try {
      // Request OTP from Firebase
      const confirmation = await auth().signInWithPhoneNumber(formData.phone);
      setVerificationId(confirmation.verificationId);
      setOtpSent(true);
      setResendTimer(60); // Start 60 second countdown
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

  const handleResendOTP = async () => {
    if (resendTimer > 0) {
      Alert.alert("Wait", `Please wait ${resendTimer} seconds before requesting a new OTP`);
      return;
    }
    await sendOTP();
  };

  const handleRegister = async () => {
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

      // Register user with backend
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        firebase_uid: firebaseUid,
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        gender: formData.gender,
      });

      if (response.data.success) {
        Alert.alert(
          "Success",
          "Registration successful! Please login.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
      }
    } catch (error) {
      console.error("Registration Error:", error);
      let errorMessage = "Failed to register. Please try again.";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Register</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Enter your name"
            value={formData.name}
            onChangeText={(text) => handleInputChange("name", text)}
            autoCapitalize="words"
            returnKeyType="next"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="Phone Number"
            value={formData.phone}
            onChangeText={(text) => handleInputChange("phone", "+91" + text.slice(3))}
            keyboardType="phone-pad"
            maxLength={13}
            editable={!otpSent}
            returnKeyType="next"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
              placeholder="Enter password"
              value={formData.password}
              onChangeText={(text) => handleInputChange("password", text)}
              secureTextEntry={!showPassword}
              returnKeyType="next"
            />
            <TouchableOpacity
              style={styles.eyeIconContainer}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, errors.confirmPassword && styles.inputError]}
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange("confirmPassword", text)}
              secureTextEntry={!showConfirmPassword}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.eyeIconContainer}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.eyeIcon}>{showConfirmPassword ? "👁️" : "👁️‍🗨️"}</Text>
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Role</Text>
          <Picker
            selectedValue={formData.role}
            style={styles.picker}
            onValueChange={(value) => handleInputChange("role", value)}
          >
            <Picker.Item label="Normal User" value="Normal User" />
            <Picker.Item label="Policeman" value="Policeman" />
            <Picker.Item label="Hospital Emergency" value="Hospital Emergency" />
            <Picker.Item label="Ambulance" value="Ambulance" />
          </Picker>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Gender</Text>
          <Picker
            selectedValue={formData.gender}
            style={styles.picker}
            onValueChange={(value) => handleInputChange("gender", value)}
          >
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>

        {!otpSent ? (
          <TouchableOpacity
            style={styles.button}
            onPress={sendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Enter OTP</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resendOtpButton, resendTimer > 0 && styles.resendOtpButtonDisabled]}
              onPress={handleResendOTP}
              disabled={resendTimer > 0}
            >
              <Text style={styles.resendOtpText}>
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
