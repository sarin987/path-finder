import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { alert } from '../../utils/alert';
import * as ImagePicker from 'react-native-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../config/constants';
import { modernFormStyles as styles } from '../../styles/modernFormStyles';
import Icon from 'react-native-vector-icons/Feather';

const FormInput = ({ label, error, touched, ...props }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        error && touched && styles.inputError
      ]}
      placeholderTextColor="#9ca3af"
      {...props}
    />
    {error && touched && (
      <Text style={styles.errorText}>{error}</Text>
    )}
  </View>
);

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [formData, setFormData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Invalid email format';
    return '';
  };

  const validatePassword = (password, field) => {
    if (field === 'currentPassword' && !password) {
      return 'Current password is required';
    }
    if (field === 'newPassword') {
      if (!password) return 'New password is required';
      if (password.length < 8) return 'Password must be at least 8 characters';
      if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
      if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
      if (!/[0-9]/.test(password)) return 'Password must contain a number';
    }
    if (field === 'confirmPassword') {
      if (!password) return 'Please confirm your password';
      if (password !== formData.newPassword) return 'Passwords do not match';
    }
    return '';
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    let error = '';
    if (field === 'email') {
      error = validateEmail(value);
    } else {
      error = validatePassword(value, field);
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleImagePick = async () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      maxWidth: 500,
      maxHeight: 500,
    };

    try {
      const result = await ImagePicker.launchImageLibrary(options);
      if (result.didCancel) return;

      setLoading(true);
      const formData = new FormData();
      formData.append('profile_photo', {
        uri: result.assets[0].uri,
        type: result.assets[0].type,
        name: result.assets[0].fileName,
      });

      const response = await fetch(`${API_ROUTES.base}/api/users/profile-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      await updateUser({ ...user, profile_photo: data.profile_photo });
      alert('Success', 'Profile photo updated');
    } catch (error) {
      alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    const emailError = validateEmail(formData.email);
    if (emailError) {
      alert('Validation Error', emailError);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_ROUTES.base}/api/users/update-email`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      await updateUser({ ...user, email: formData.email });
      alert('Success', 'Email updated successfully');
    } catch (error) {
      alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    const passwordErrors = {
      currentPassword: validatePassword(formData.currentPassword, 'currentPassword'),
      newPassword: validatePassword(formData.newPassword, 'newPassword'),
      confirmPassword: validatePassword(formData.confirmPassword, 'confirmPassword')
    };

    if (Object.values(passwordErrors).some(error => error)) {
      alert('Validation Error', 'Please fix the errors in the form');
      setErrors(prev => ({ ...prev, ...passwordErrors }));
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_ROUTES.base}/api/users/update-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      alert('Success', 'Password updated successfully');
    } catch (error) {
      alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ 
              uri: user?.profile_photo || 'https://via.placeholder.com/150'
            }}
            style={styles.profileImage}
          />
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={handleImagePick}
          >
            <Icon name="camera" style={styles.changePhotoIcon} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Email Settings</Text>
        <FormInput
          label="Email Address"
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          error={errors.email}
          touched={touched.email}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={handleUpdateEmail}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Update Email</Text>
        </Pressable>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Security Settings</Text>
        <FormInput
          label="Current Password"
          value={formData.currentPassword}
          onChangeText={(text) => handleChange('currentPassword', text)}
          error={errors.currentPassword}
          touched={touched.currentPassword}
          placeholder="Enter current password"
          secureTextEntry
        />
        <FormInput
          label="New Password"
          value={formData.newPassword}
          onChangeText={(text) => handleChange('newPassword', text)}
          error={errors.newPassword}
          touched={touched.newPassword}
          placeholder="Enter new password"
          secureTextEntry
        />
        <FormInput
          label="Confirm Password"
          value={formData.confirmPassword}
          onChangeText={(text) => handleChange('confirmPassword', text)}
          error={errors.confirmPassword}
          touched={touched.confirmPassword}
          placeholder="Confirm new password"
          secureTextEntry
        />
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={handleUpdatePassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Update Password</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default Profile;