import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_ROUTES } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import ChatComponent from './chat/ChatComponent';

const EmergencyMenu = ({
  visible,
  onClose,
  serviceType,
  title,
  options,
  location,
  user,
  navigation
}) => {
  const [emergencyProfile, setEmergencyProfile] = useState({
    medicalHistory: '',
    allergies: '',
    bloodType: '',
    emergencyContacts: []
  });

  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const loadEmergencyProfile = async () => {
    try {
      const profile = await AsyncStorage.getItem('emergencyProfile');
      if (profile) {
        setEmergencyProfile(JSON.parse(profile));
      }
    } catch (error) {
      console.error('Error loading emergency profile:', error);
    }
  };

  const saveEmergencyProfile = async () => {
    try {
      await AsyncStorage.setItem('emergencyProfile', JSON.stringify(emergencyProfile));
      Alert.alert('Success', 'Emergency profile saved successfully');
      setShowProfileEditor(false);
    } catch (error) {
      console.error('Error saving emergency profile:', error);
      Alert.alert('Error', 'Failed to save emergency profile');
    }
  };

  useEffect(() => {
    loadEmergencyProfile();
  }, []);

  const handleOptionPress = async (option) => {
    try {
      if (!user?.id) {
        Alert.alert('Login Required', 'Please login to use this service.');
        return;
      }

      if (!location) {
        Alert.alert('Location Required', 'Please enable location services.');
        return;
      }

      switch (option.type) {
        case 'profile':
          setShowProfileEditor(true);
          return;

        case 'chat':
          setShowChat(true);
          setSelectedService(serviceType);
          break;

        case 'share':
          navigation.navigate(`${serviceType}Dashboard`, {
            screen: 'Location',
            params: {
              location,
              user
            }
          });
          break;

        case 'call':
          navigation.navigate(`${serviceType}Dashboard`, {
            screen: 'Call',
            params: {
              location,
              user
            }
          });
          break;

        case 'thanks':
          navigation.navigate(`${serviceType}Dashboard`, {
            screen: 'ThankYou',
            params: {
              location,
              user,
              message: 'Thank you for your service!'
            }
          });
          break;
      }
    } catch (error) {
      console.error(`${serviceType} option error:`, error);
      Alert.alert('Error', `Failed to ${option.action}. Please try again.`);
    } finally {
      if (option.type !== 'chat') {
        onClose();
      }
    }
  };

  const handleChatClose = () => {
    setShowChat(false);
    onClose();
  };

  const profileOption = {
    type: 'profile',
    icon: 'account-edit',
    color: '#2196F3',
    label: 'Edit Emergency Profile',
    action: 'edit profile'
  };

  const profileOptions = [
    { type: 'medical', icon: 'medical-bag', label: 'Medical History' },
    { type: 'allergies', icon: 'allergy', label: 'Allergies' },
    { type: 'blood', icon: 'blood-bag', label: 'Blood Type' },
    { type: 'contacts', icon: 'account-multiple', label: 'Emergency Contacts' }
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {showChat ? (
            <ChatComponent
              serviceType={selectedService}
              location={location}
              user={user}
              emergencyProfile={emergencyProfile}
              onClose={handleChatClose}
            />
          ) : showProfileEditor ? (
            <View style={styles.profileContainer}>
              <ScrollView style={styles.modalBody}>
                <Text style={styles.sectionTitle}>Emergency Profile</Text>
                {profileOptions.map((option) => (
                  <View key={option.type} style={styles.profileSection}>
                    <Text style={styles.profileLabel}>{option.label}</Text>
                    <TextInput
                      style={styles.profileInput}
                      value={emergencyProfile[option.type === 'contacts' ? 'emergencyContacts' : option.type]}
                      onChangeText={(text) => {
                        setEmergencyProfile(prev => ({
                          ...prev,
                          [option.type === 'contacts' ? 'emergencyContacts' : option.type]: text
                        }));
                      }}
                      multiline={option.type === 'medical'}
                    />
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveEmergencyProfile}
                >
                  <Text style={styles.saveButtonText}>Save Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowProfileEditor(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          ) : (
            <ScrollView style={styles.modalBody}>
              {[profileOption, ...options].map((option, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.menuItem}
                  onPress={() => handleOptionPress(option)}
                >
                  <MaterialCommunityIcons 
                    name={option.icon} 
                    size={24} 
                    color={option.color}
                  />
                  <Text style={styles.menuText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  profileContainer: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    marginBottom: 15,
  },
  profileLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    minHeight: 40,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF4081',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
});

export default EmergencyMenu;