import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../styles/colors';

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
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="phone" size={20} color="#007AFF" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
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
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="numeric" size={20} color="#007AFF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              placeholderTextColor="#666"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleVerifyOtp}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.gradientButton}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleSendOtp}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.gradientButton}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.switchMethodButton}
        onPress={() => setLoginMethod('password')}
      >
        <Text style={styles.linkText}>Login with Password instead</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e4e9f2',
    borderRadius: 12,
    marginBottom: 12,
    height: 50,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  inputIcon: {
    marginRight: 12,
    color: '#007AFF',
    width: 24,
    height: 24,
    alignSelf: 'center',
    textAlign: 'center',
    lineHeight: 24,
  },
  input: {
    flex: 1,
    height: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 0,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    paddingVertical: 0,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    height: 50,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchMethodButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
