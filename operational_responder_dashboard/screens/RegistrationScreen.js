import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const roles = [
  { label: 'Police', value: 'police' },
  { label: 'Ambulance', value: 'ambulance' },
  { label: 'Fire', value: 'fire' },
];

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

export default function RegistrationScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('police');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [gender, setGender] = useState('male');
  const navigation = useNavigation();

  const handleRegister = async () => {
    try {
      await axios.post(`http://localhost:5000/api/auth/register/${role}`, {
        name,
        phone,
        password,
        email,
        gender
      });
      navigation.replace('Login');
    } catch (err) {
      if (err.response && err.response.data) {
        setError(
          err.response.data.message ||
          err.response.data.error ||
          JSON.stringify(err.response.data)
        );
      } else if (err.request) {
        setError('No response from server. Please check your backend connection.');
      } else {
        setError('Registration failed: ' + err.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Responder Registration</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={phone}
          onChangeText={text => {
            if (!text.startsWith('+91')) {
              setPhone('+91');
            } else {
              setPhone(text);
            }
          }}
          keyboardType="phone-pad"
        />
        <View style={styles.dropdownRow}>
          {genderOptions.map(g => (
            <TouchableOpacity
              key={g.value}
              style={[styles.dropdownBtn, gender === g.value && styles.dropdownBtnActive]}
              onPress={() => setGender(g.value)}
            >
              <Text style={gender === g.value ? styles.dropdownTextActive : styles.dropdownText}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.rolePicker}>
          {roles.map(r => (
            <TouchableOpacity
              key={r.value}
              style={[styles.roleButton, role === r.value && styles.roleButtonActive]}
              onPress={() => setRole(r.value)}
            >
              <Text style={role === r.value ? styles.roleTextActive : styles.roleText}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
          <Text style={styles.registerBtnText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.replace('Login')}>
          <Text style={styles.loginBtnText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#222',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    paddingLeft: 16,
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  dropdownBtn: {
    flex: 1,
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
  },
  dropdownBtnActive: {
    backgroundColor: '#2563eb',
  },
  dropdownText: {
    color: '#222',
    fontWeight: '500',
  },
  dropdownTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  rolePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  roleButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#2563eb',
  },
  roleText: {
    color: '#222',
    fontWeight: '500',
  },
  roleTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  registerBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  registerBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  loginBtn: {
    alignItems: 'center',
    padding: 10,
  },
  loginBtnText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
