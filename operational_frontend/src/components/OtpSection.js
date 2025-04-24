import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { authStyles, colors } from '../styles/authStyles';

export const OtpSection = ({
  phone,
  setPhone,
  otp,
  setOtp,
  isOtpSent,
  handleSendOtp,
  handleVerifyOtp,
  setLoginMethod,
  isLoading,
}) => {
  return (
    <>
      <View style={authStyles.inputContainer}>
        <MaterialCommunityIcons name="phone" size={20} color="#007AFF" style={authStyles.inputIcon} />
        <TextInput
          style={authStyles.input}
          placeholder="Phone Number (with +91)"
          placeholderTextColor="#666"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!isOtpSent}
        />
      </View>

      {isOtpSent ? (
        <>
          <View style={authStyles.inputContainer}>
            <MaterialCommunityIcons name="numeric" size={20} color="#007AFF" style={authStyles.inputIcon} />
            <TextInput
              style={authStyles.input}
              placeholder="Enter OTP"
              placeholderTextColor="#666"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          <TouchableOpacity 
            style={authStyles.loginButton}
            onPress={handleVerifyOtp}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={authStyles.gradientButton}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={authStyles.buttonText}>Verify OTP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : (
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
      )}

      <TouchableOpacity
        style={authStyles.switchMethodButton}
        onPress={() => setLoginMethod('password')}
      >
        <Text style={authStyles.linkText}>Login with Password instead</Text>
      </TouchableOpacity>
    </>
  );
};