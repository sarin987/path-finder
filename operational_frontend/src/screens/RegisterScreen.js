import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import auth from "@react-native-firebase/auth"; 
import axios from "axios"; 
import { styles } from "../styles/RegisterScreenStyles"; 

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("Male");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleSendOtp = async () => {
    if (!name || !phone || !password || !gender) {
      alert("Please fill in all fields");
      return;
    }
    setLoading(true);

    try {
      console.log("Sending OTP with phone number:", phone);  // Debugging log

      const confirmation = await auth().signInWithPhoneNumber(phone);
      console.log("OTP Sent! Verification ID:", confirmation.verificationId);  // Debugging log

      setVerificationId(confirmation.verificationId); // Save the verification ID to verify OTP later
      alert("OTP Sent! Please check your phone.");
      setIsOtpSent(true); // Show OTP input after OTP is sent
    } catch (error) {
      console.log("Error sending OTP:", error);  // Debugging log
      alert("Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!verificationId) {
      alert("Please send OTP first.");
      return;
    }

    setLoading(true);

    try {
      console.log("Resending OTP with phone number:", phone);  // Debugging log

      const confirmation = await auth().signInWithPhoneNumber(phone);
      setVerificationId(confirmation.verificationId); // Save the new verification ID
      alert("OTP Resent! Please check your phone.");
    } catch (error) {
      console.log("Error resending OTP:", error);  // Debugging log
      alert("Error resending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      alert("Please enter the OTP.");
      return;
    }

    setLoading(true);

    try {
      console.log("Verifying OTP with verificationId:", verificationId);  // Debugging log
      console.log("Entered OTP:", otp);  // Debugging log

      // Verify the OTP with Firebase
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await auth().signInWithCredential(credential);

      if (userCredential.user) {
        const firebaseUid = userCredential.user.uid; // Get the Firebase UID

        console.log("Firebase UID:", firebaseUid);  // Debugging log

        // Send the Firebase UID and other user details to the backend
        const payload = {
          firebase_uid: verificationId, // Pass the Firebase UID
          otp,
          name,
          phone,
          password,
          gender,
        };

        const response = await axios.post("http://192.168.14.103:5000/api/auth/verify", payload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log("Response from backend:", response.data);  // Debugging log

        if (response.data.success) {
          alert("User registered successfully!");
          navigation.navigate("Login"); // Navigate to login page after successful registration
        } else {
          alert("Registration failed: " + response.data.error);
        }
      } else {
        alert("OTP verification failed.");
      }
    } catch (error) {
      console.error("OTP verification failed:", error);  // Debugging log
      alert("Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Register User</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={(text) => setPhone("+91" + text.slice(3))}
              keyboardType="phone-pad"
              maxLength={13}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.radioButtonContainer}>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setGender("Male")}
              >
                <Text style={styles.radioButtonText}>Male</Text>
                {gender === "Male" && <View style={styles.selectedCircle} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setGender("Female")}
              >
                <Text style={styles.radioButtonText}>Female</Text>
                {gender === "Female" && <View style={styles.selectedCircle} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setGender("Other")}
              >
                <Text style={styles.radioButtonText}>Other</Text>
                {gender === "Other" && <View style={styles.selectedCircle} />}
              </TouchableOpacity>
            </View>
          </View>

          {!isOtpSent ? (
            <TouchableOpacity
              style={styles.button}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Enter OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP & Register</Text>}
              </TouchableOpacity>

              {/* Resend OTP Button */}
              <TouchableOpacity
                style={styles.resendOtpButton}
                onPress={handleResendOtp}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.resendOtpText}>Resend OTP</Text>}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
