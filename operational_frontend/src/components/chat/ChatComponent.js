import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ActivityIndicator,
  Alert,
  AppState
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LocationShareButton from '../LocationShareButton';
import { authRequest } from '../../services/authService';

/**
 * @typedef {Object} Location
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} [address]
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} text
 * @property {string} senderId
 * @property {string} senderName
 * @property {string} timestamp
 * @property {'text'|'location'} type
 * @property {Location} [location]
 */

/**
 * @typedef {Object} ChatComponentProps
 * @property {string} serviceType
 * @property {Location} [location]
 * @property {{id: string, name: string}} user
 * @property {any} [emergencyProfile]
 * @property {() => void} onClose
 */

/**
 * ChatComponent - A real-time chat interface
 * @param {ChatComponentProps} props
 */
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
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  /**
   * Establishes a WebSocket connection
   * @returns {WebSocket|null} The WebSocket instance or null if connection failed
   */
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('wss://your-api-endpoint.com/chat');
      
      ws.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        setLoading(false);
        setError(null);
        reconnectAttempts.current = 0;
      };
      
      ws.onmessage = (e) => {
        try {
          /** @type {Message} */
          const message = JSON.parse(e.data);
          setMessages(prevMessages => [...prevMessages, message]);
          // Auto-scroll to bottom when new message arrives
          if (flatListRef.current && flatListRef.current.scrollToEnd) {
            setTimeout(() => {
              flatListRef.current.scrollToEnd({ animated: true });
            }, 100);
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      
      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        setError('Connection error. Please try again.');
        setLoading(false);
      };
      
      ws.onclose = (e) => {
        console.log('WebSocket disconnected:', e.code, e.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not closed normally
        if (e.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          console.log(`Reconnecting in ${delay}ms... (Attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Unable to connect to chat. Please check your internet connection and try again.');
        }
      };
      
      socketRef.current = ws;
      return ws;
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      setError('Failed to connect to chat service');
      setLoading(false);
      return null;
    }
  }, [serviceType, user.id]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && !isConnected && !loading) {
        console.log('App has come to the foreground - reconnecting WebSocket');
        connectWebSocket();
      } else if (nextAppState === 'background' && socketRef.current) {
        console.log('App is in background - disconnecting WebSocket');
        socketRef.current.close();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [isConnected, loading, connectWebSocket]);

  // Initialize WebSocket connection
  useEffect(() => {
    const ws = connectWebSocket();
    
    // Clean up on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connectWebSocket, serviceType]);

  /**
   * Sends a chat message
   */
  const sendMessage = useCallback(async () => {
    const messageText = input.trim();
    if (!messageText || !user || !socketRef.current || !isConnected) {
      Alert.alert('Error', 'Unable to send message. Please check your connection.');
      return;
    }

    try {
      /** @type {Message} */
      const messageData = {
        id: Date.now().toString(),
        text: messageText,
        senderId: user.id,
        senderName: user.name || 'Anonymous',
        type: 'text',
        timestamp: new Date().toISOString()
      };

      // Add location if available
      if (location) {
        messageData.type = 'location';
        messageData.location = {
          latitude: location.latitude,
          longitude: location.longitude
        };
        if (location.address) {
          messageData.location.address = location.address;
        }
      }

      // Optimistically update UI
      setMessages(prev => [...prev, messageData]);
      setInput('');
      
      // Scroll to bottom after state update
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Send message via WebSocket
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(messageData));
      } else {
        throw new Error('WebSocket is not connected');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      
      // Revert optimistic update on error
      setMessages(prev => prev.slice(0, -1));
      setInput(messageText);
    }
  }, [input, user, isConnected, location]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Connecting to chat...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ff3b30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => setLoading(true)}
        >
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          keyExtractor={item => item.id}
          inverted
          contentContainerStyle={styles.messagesContainer}
          renderItem={({ item }) => (
            <View style={[
              styles.messageBubble,
              item.senderId === user.id ? styles.sentMessage : styles.receivedMessage
            ]}>
              {item.senderId !== user.id && (
                <Text style={styles.senderName}>
                  {item.senderName}
                </Text>
              )}
              {item.type === 'text' ? (
                <Text style={[
                  styles.messageText,
                  item.senderId === user.id ? styles.sentMessageText : null
                ]}>
                  {item.text}
                </Text>
              ) : item.type === 'location' && item.location ? (
                <View style={styles.locationContainer}>
                  <Text style={[
                    styles.messageText,
                    item.senderId === user.id ? styles.sentMessageText : null
                  ]}>
                    📍 Location Shared
                  </Text>
                  <Text style={styles.locationText}>
                    {item.location.address || 
                     `Lat: ${item.location.latitude.toFixed(4)}, Lng: ${item.location.longitude.toFixed(4)}`}
                  </Text>
                </View>
              ) : null}
              <Text style={[
                styles.messageTime,
                item.senderId === user.id ? styles.sentMessageTime : null
              ]}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Say hello! 👋</Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!input.trim()}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="send" 
              size={22} 
              color={!input.trim() ? 'rgba(255,255,255,0.5)' : '#fff'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  messagesContainer: {
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    marginRight: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    maxHeight: 120,
    textAlignVertical: 'center',
    color: '#333',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
  },
  sendButtonDisabled: {
    backgroundColor: '#a0c4ff',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
    marginLeft: '20%',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    marginRight: '20%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  senderName: {
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 4,
    color: '#555',
  },
  messageText: {
    color: '#000',
    fontSize: 16,
    lineHeight: 22,
  },
  sentMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
    color: 'rgba(0,0,0,0.5)',
  },
  sentMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  locationContainer: {
    marginTop: 6,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
});

export default ChatComponent;