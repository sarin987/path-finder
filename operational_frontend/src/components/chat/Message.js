import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageMessage from '../../components/common/ImageMessage';

const Message = ({ message, isOwnMessage }) => {
  return (
    <View style={[
      styles.messageContainer,
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
    ]}>
      <View style={[
        styles.messageContent,
        isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
      ]}>
        {message.imageUrl ? (
          <ImageMessage uri={message.imageUrl} caption={message.message} />
        ) : (
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownText : styles.otherText,
          ]}>{message.message}</Text>
        )}
        <Text style={[
          styles.timestamp,
          isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
        ]}>
          {message.timestamp ? `${new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${new Date(message.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' })}` : ''}
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
    alignItems: 'flex-end',
    marginBottom: 10,
    maxWidth: '100%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  messageContent: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '80%',
    minWidth: 60,
  },
  ownMessageBubble: {
    backgroundColor: '#4A90E2',
    borderTopRightRadius: 0,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#222',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  ownTimestamp: {
    color: '#dbeafe',
  },
  otherTimestamp: {
    color: '#888',
  },
  avatar: {
    marginLeft: 10,
  },
});

export default Message;
