import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Message = ({ message, isOwnMessage }) => {
  return (
    <View style={[
      styles.messageContainer,
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      <View style={styles.messageContent}>
        <Text style={styles.messageText}>{message.text}</Text>
        <Text style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      {!isOwnMessage && (
        <MaterialCommunityIcons 
          name="account-circle" 
          size={24} 
          color="#666"
          style={styles.avatar}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 10,
    borderTopLeftRadius: 0,
    maxWidth: '80%',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  timestamp: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  avatar: {
    marginLeft: 10,
  },
});

export default Message;