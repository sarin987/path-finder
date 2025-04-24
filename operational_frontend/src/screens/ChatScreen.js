import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  Text,
} from 'react-native';

const ChatScreen = ({ route }) => {
  const { type } = route.params; // Emergency type (e.g., police, ambulance)
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (input.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: input,
        type: 'user',
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInput('');
      // TODO: Send message to backend with location if enabled
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={item.type === 'user' ? styles.userMessage : styles.otherMessage}>
            {item.text}
          </Text>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ccc',
    color: 'black',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
});

export default ChatScreen;