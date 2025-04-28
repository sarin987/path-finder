import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  Text,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { socket } from '../utils/socket';
import { useAuth } from '../contexts/AuthContext';
import Message from '../components/chat/Message';
import Notification from '../components/common/Notification';
import { uploadImageAsync } from '../services/firebaseUpload';

const ChatScreen = ({ route }) => {
  const { type } = route.params; // Emergency type (e.g., police, ambulance)
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [notification, setNotification] = useState(null);
  const flatListRef = useRef(null);

  // Listen for incoming messages
  useEffect(() => {
    socket.emit('join_chat', { chat_type: type, user_id: user?.id, other_user_id: null });
    const handleChatMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };
    socket.on('chat_message', handleChatMessage);
    socket.on('chat_history', (history) => {
      setMessages(history);
    });
    return () => {
      socket.off('chat_message', handleChatMessage);
      socket.off('chat_history');
      socket.emit('leave_chat', { chat_type: type, user_id: user?.id, other_user_id: null });
    };
  }, [type, user?.id]);

  const pickImage = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.7,
      includeBase64: false,
    };
    launchImageLibrary(options, async (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        setNotification({ message: 'Image pick failed', type: 'error' });
        setTimeout(() => setNotification(null), 2000);
        return;
      }
      const asset = response.assets && response.assets[0];
      if (asset && asset.uri) {
        setNotification({ message: 'Uploading image...', type: 'info' });
        try {
          const imageUrl = await uploadImageAsync(asset.uri);
          const message = {
            sender_id: user?.id,
            receiver_id: null,
            message: input,
            chat_type: type,
            imageUrl
          };
          socket.emit('chat_message', message);
          setInput('');
          setNotification({ message: 'Image sent!', type: 'success' });
        } catch (err) {
          setNotification({ message: 'Image upload failed', type: 'error' });
        }
        setTimeout(() => setNotification(null), 2000);
      }
    });
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const message = {
      sender_id: user?.id,
      receiver_id: null, // For group chat. Set to other user's id for 1:1
      message: input,
      chat_type: type,
    };
    socket.emit('chat_message', message);
    setInput('');
    flatListRef.current?.scrollToEnd({ animated: true });
    setNotification({ message: 'Message sent!', type: 'success' });
    setTimeout(() => setNotification(null), 2000);
  };

  return (
    <View style={styles.container}>
      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <Message message={item} isOwnMessage={item.sender_id === user?.id} />
        )}
        contentContainerStyle={{ paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          value={input}
          onChangeText={setInput}
        />
        <Button title="Send" onPress={sendMessage} color="#4A90E2" />
        <Button title="Image" onPress={pickImage} color="#7B61FF" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FB',
    padding: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#F0F2F5',
    marginRight: 8,
    fontSize: 16,
    color: '#222',
  },
});

export default ChatScreen;