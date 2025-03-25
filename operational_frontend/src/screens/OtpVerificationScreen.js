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

const OtpVerificationScreen = ({ route, navigation }) => {
  const { verificationId, name, phone, password, gender } = route.params;
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp) {
      alert("Please enter the OTP.");
      return;
    }
  
    setLoading(true);
  
    try {
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await auth().signInWithCredential(credential);
  
      if (userCredential.user) {
        // Get the Firebase UID after successful OTP verification
        const firebaseUid = userCredential.user.uid;
  
        // Send user data along with firebase_uid to backend after OTP verification
        const response = await axios.post("http://192.168.1.121:5000/api/auth/verify-otp", {
          firebase_uid: firebaseUid,
          otp,
          phone, // Send phone to link the user
        });
  
        if (response.data.success) {
          Alert.alert("Success", "OTP verified successfully. Registration completed.");
          navigation.navigate("Login"); // Redirect to login page after successful verification
        } else {
          alert("Error: " + response.data.error);
        }
      } else {
        alert("OTP verification failed.");
      }
    } catch (error) {
      console.error("OTP verification failed:", error);
      alert("Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };
  
  
  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Enter OTP</Text>

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
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default OtpVerificationScreen;
