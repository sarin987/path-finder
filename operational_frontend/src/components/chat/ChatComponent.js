import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Text,
  Image,
  ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  onSnapshot,
  doc,
  updateDoc
} from '@react-native-firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../config/firebase';
import LocationShareButton from '../LocationShareButton';

const ChatComponent = ({ 
  serviceType,
  location,
  user,
  emergencyProfile,
  onClose 
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  try {
    if (!db) {
      setError('Firebase is not properly initialized');
      setLoading(false);
      return;
    }

    // Initialize Firestore listeners
    const messagingRef = collection(db, 'messages'); // This should work now
    const q = query(
      messagingRef,
      where('serviceType', '==', serviceType),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messages);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to messages:', error);
      setError('Error fetching messages');
      setLoading(false);
    });

    return () => unsubscribe();
  } catch (error) {
    console.error('Error setting up chat:', error);
    setError('Error setting up chat');
    setLoading(false);
  }
}, [serviceType, db]);

  const sendMessage = async () => {
    try {
      if (!db) {
        setError('Firebase is not properly initialized');
        return;
      }

      const newMessage = {
        text: input,
        senderId: user.id,
        senderName: user.name,
        timestamp: new Date().toISOString(),
        type: 'text',
        serviceType,
        emergencyProfile,
        location,
        isRead: false
      };

      await addDoc(collection(db, 'messages'), newMessage);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error sending message');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          inverted
          renderItem={({ item }) => (
            <View style={{
              maxWidth: '80%',
              margin: 8,
              padding: 12,
              borderRadius: 10,
              alignSelf: item.senderId === user.id ? 'flex-end' : 'flex-start',
              backgroundColor: item.senderId === user.id ? '#007AFF' : '#E5E5EA'
            }}>
              {item.type === 'text' ? (
                <Text style={{ color: item.senderId === user.id ? '#fff' : '#000' }}>
                  {item.text}
                </Text>
              ) : item.type === 'location' ? (
                <View style={{ flexDirection: 'column' }}>
                  <Text style={{ color: item.senderId === user.id ? '#fff' : '#000' }}>
                    Location shared
                  </Text>
                  <Text style={{ color: item.senderId === user.id ? '#fff' : '#000' }}>
                    Lat: {item.location.latitude}, Long: {item.location.longitude}
                  </Text>
                </View>
              ) : null}
              <Text style={{
                fontSize: 10,
                color: '#666',
                alignSelf: 'flex-end',
                marginTop: 4
              }}>
                {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          )}
        />

        <View style={{
          flexDirection: 'row',
          padding: 12,
          borderTopWidth: 1,
          borderTopColor: '#eee',
          backgroundColor: '#fff'
        }}>
          <TextInput
            style={{
              flex: 1,
              marginRight: 8,
              padding: 12,
              borderRadius: 25,
              backgroundColor: '#f0f0f0'
            }}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#007AFF'
            }}
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <LocationShareButton
          userId={user.id}
          userDisplayName={user.name}
          serviceType={serviceType}
          emergencyProfile={emergencyProfile}
          apiEndpoint="YOUR_POLICE_DASHBOARD_API_ENDPOINT"
          style={{ margin: 12 }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatComponent; 