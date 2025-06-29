import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const LogoutButton = ({ onLogout, buttonSize = 'default', style }) => {
  const isSmall = buttonSize === 'small';
  return (
    <TouchableOpacity
      style={[styles.logoutBtn, isSmall && styles.logoutBtnSmall, style]}
      onPress={onLogout}
    >
      <Text style={[styles.logoutText, isSmall && styles.logoutTextSmall]}>Logout</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  logoutBtn: {
    marginTop: 12,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignSelf: 'center',
  },
  logoutBtnSmall: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  logoutTextSmall: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default LogoutButton;
