import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const roles = [
  { label: 'Police', value: 'police' },
  { label: 'Ambulance', value: 'ambulance' },
  { label: 'Fire', value: 'fire' },
];

export default function LoginScreen() {
  const [phone, setPhone] = useState('+91');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('police');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { login, user } = useAuth();

  React.useEffect(() => {
    // If user is logged in, navigate to Dashboard
    if (user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    }
  }, [user]);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', {
        phone,
        password,
        role
      });
      if (data.user && (data.user.role === 'police' || data.user.role === 'ambulance' || data.user.role === 'fire')) {
        await login(data); // Pass the whole response object as expected by AuthContext
      } else {
        setError('Role not assigned. Contact admin.');
      }
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Responder Login</Text>
      <View style={styles.form}>
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
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
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
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          <Text style={styles.loginBtnText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.replace('Registration')} disabled={loading}>
          <Text style={styles.registerBtnText}>Register</Text>
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
  loginBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  registerBtn: {
    alignItems: 'center',
    padding: 10,
  },
  registerBtnText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
