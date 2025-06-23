import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
  Animated,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ChatScreen = ({ route, navigation }) => {
  console.log('ChatScreen mounted with route params:', route.params);
  
  if (!route.params?.responder) {
    console.error('No responder data provided to ChatScreen');
    
    // Show error message and navigate back if no responder data
    useEffect(() => {
      Alert.alert('Error', 'No responder information available. Please try again.');
      navigation.goBack();
    }, []);
    
    return (
      <View style={styles.loadingContainer}>
        <Text>Error: No responder information available</Text>
      </View>
    );
  }
  
  const { responder } = route.params;
  console.log('Chatting with responder:', JSON.stringify(responder, null, 2));
  
  const { user } = useAuth();
  const { 
    socket, 
    chats, 
    sendMessage, 
    typingStatus, 
    markAsRead,
    setActiveChat,
  } = useChat();
  
  // Set up header with responder's name
  useEffect(() => {
    navigation.setOptions({
      title: responder?.name || 'Chat',
      headerBackTitle: 'Back'
    });
  }, [responder?.name]);
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeout = useRef(null);

  const chatKey = `responder_${responder.id}`;
  const messages = chats[chatKey] || [];
  const isTypingStatus = typingStatus[responder.id] || false;

  // Set active chat and mark messages as read when screen is focused
  useFocusEffect(
    useCallback(() => {
      setActiveChat(responder.id);
      markAsRead(responder.id);
      
      return () => {
        setActiveChat(null);
      };
    }, [responder.id, setActiveChat, markAsRead])
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Handle typing indicator with debounce
  const handleTyping = (text) => {
    setMessage(text);
    
    if (!isTyping) {
      socket?.emit('typing', {
        senderId: user.id,
        receiverId: responder.id,
        isTyping: true,
      });
      setIsTyping(true);
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      socket?.emit('typing', {
        senderId: user.id,
        receiverId: responder.id,
        isTyping: false,
      });
      setIsTyping(false);
    }, 1000);
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    
    // Clear input immediately for better UX
    setMessage('');
    
    // Send the message
    sendMessage(responder.id, trimmedMessage);
    
    // Clear typing status when sending
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
    
    // Update typing status
    setIsTyping(false);
    socket?.emit('typing', {
      senderId: user.id,
      receiverId: responder.id,
      isTyping: false,
    });
    
    // Dismiss keyboard after sending on iOS
    if (Platform.OS === 'ios') {
      Keyboard.dismiss();
    }
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.isOwn;
    const timeString = new Date(item.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return (
      <View 
        style={[
          styles.messageBubble,
          isOwn ? styles.sentMessage : styles.receivedMessage,
          { marginBottom: 8 }
        ]}
      >
        <Text style={[
          styles.messageText,
          isOwn ? styles.sentMessageText : styles.receivedMessageText
        ]}>
          {item.message}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            isOwn && styles.sentTimestamp
          ]}>
            {timeString}
          </Text>
          {isOwn && (
            <MaterialIcons 
              name={item.status === 'sending' ? 'schedule' : 'done-all'}
              size={14} 
              color={item.status === 'delivered' ? '#4CAF50' : '#9E9E9E'} 
              style={styles.statusIcon}
            />
          )}
        </View>
      </View>
    );
  };

  const [dotAnimation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    if (isTypingStatus) {
      // Start animation when typing starts
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      
      animation.start();
      return () => animation.stop();
    } else {
      dotAnimation.setValue(0);
    }
  }, [isTypingStatus]);
  
  const renderTypingIndicator = () => {
    if (!isTypingStatus) return null;
    
    const dot1Opacity = dotAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.4, 1, 0.4],
    });
    
    const dot2Opacity = dotAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.4, 1],
    });
    
    const dot3Opacity = dotAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.4, 0.6],
    });
    
    return (
      <View style={[styles.messageBubble, styles.receivedMessage, styles.typingIndicator]}>
        <Animated.View style={[styles.typingDot, { opacity: dot1Opacity }]} />
        <Animated.View style={[styles.typingDot, styles.typingDotMiddle, { opacity: dot2Opacity }]} />
        <Animated.View style={[styles.typingDot, { opacity: dot3Opacity }]} />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.responderName} numberOfLines={1}>
            {responder.name || 'Chat'}
          </Text>
          {isTypingStatus && (
            <Text style={styles.typingStatusText}>
              typing...
            </Text>
          )}
        </View>
        
        <View style={styles.headerRight}>
          {/* Additional header actions can go here */}
        </View>
      </View>
      
      <FlatList
        ref={flatListRef}
        style={styles.messagesContainer}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id || item.tempId}
        contentContainerStyle={{ flexGrow: 1, paddingTop: 8 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={renderTypingIndicator}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      {/* Input Container */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            placeholderTextColor="#adb5bd"
            multiline
            maxHeight={120}
            textAlignVertical="center"
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
            enablesReturnKeyAutomatically={true}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              !message.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!message.trim()}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons 
              name="send" 
              size={20} 
              color={message.trim() ? '#fff' : '#ced4da'} 
              style={styles.sendButtonIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  responderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  typingStatusText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#fff',
  },
  receivedMessageText: {
    color: '#212529',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.4)',
    marginRight: 4,
  },
  sentTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  statusIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    paddingVertical: 8,
    paddingRight: 8,
    fontSize: 16,
    color: '#212529',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#e9ecef',
  },
  sendButtonIcon: {
    marginLeft: 2,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 60,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6c757d',
    marginHorizontal: 2,
  },
  typingDotMiddle: {
    marginHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});

export default ChatScreen;
