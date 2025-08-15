import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import config from '../config';
const { BASE_URL, API_VERSION } = config;
const API_URL = `${BASE_URL}${API_VERSION}`;
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  return useContext(ChatContext);
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [chats, setChats] = useState({});
  const [typingStatus, setTypingStatus] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      // Use the API_URL from the config
      const socketUrl = API_URL;
      const newSocket = io(socketUrl, {
        query: { userId: user.id, role: user.role },
        transports: ['websocket'],
      });

      const handleConnect = () => {
        console.log('Connected to WebSocket server');
      };

      const handleDisconnect = () => {
        console.log('Disconnected from WebSocket server');
      };

      const handleChatMessage = (message) => {
        // Handle incoming messages
        const chatKey = `${message.sender_role === 'user' ? 'user_' : 'responder_'}${message.sender_id}`;
        setChats(prevChats => ({
          ...prevChats,
          [chatKey]: [...(prevChats[chatKey] || []), { ...message, isOwn: false }],
        }));

        // Update unread count if not in active chat
        if (activeChat !== message.sender_id) {
          setUnreadCounts(prev => ({
            ...prev,
            [chatKey]: (prev[chatKey] || 0) + 1,
          }));
        }
      };

      const handleMessageDelivered = ({ messageId }) => {
        // Update message status to delivered
        setChats(prevChats => {
          const updatedChats = { ...prevChats };
          Object.keys(updatedChats).forEach(chatKey => {
            updatedChats[chatKey] = updatedChats[chatKey].map(msg =>
              msg.id === messageId ? { ...msg, status: 'delivered' } : msg
            );
          });
          return updatedChats;
        });
      };

      const handleUserTyping = ({ senderId, isTyping }) => {
        setTypingStatus(prev => ({
          ...prev,
          [senderId]: isTyping,
        }));
      };

      // Set up event listeners
      newSocket.on('connect', handleConnect);
      newSocket.on('disconnect', handleDisconnect);
      newSocket.on('chat_message', handleChatMessage);
      newSocket.on('message_delivered', handleMessageDelivered);
      newSocket.on('user_typing', handleUserTyping);

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Clean up function
      return () => {
        if (newSocket) {
          newSocket.off('connect', handleConnect);
          newSocket.off('disconnect', handleDisconnect);
          newSocket.off('chat_message', handleChatMessage);
          newSocket.off('message_delivered', handleMessageDelivered);
          newSocket.off('user_typing', handleUserTyping);
          newSocket.disconnect();
        }
      };
    }
  }, [user?.id, user?.role, activeChat, setChats, setUnreadCounts, setTypingStatus, API_URL]);

  const sendMessage = (receiverId, message, senderRole = user.role) => {
    if (!socket || !message.trim()) {return;}

    const tempId = Date.now();
    const newMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: receiverId,
      sender_role: senderRole,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      is_read: false,
      status: 'sending',
      isOwn: true,
    };

    // Update UI optimistically
    const chatKey = `${senderRole === 'user' ? 'responder_' : 'user_'}${receiverId}`;
    setChats(prevChats => ({
      ...prevChats,
      [chatKey]: [...(prevChats[chatKey] || []), newMessage],
    }));

    // Send message through socket
    socket.emit('send_message', {
      senderId: user.id,
      receiverId,
      senderRole,
      message: message.trim(),
    });

    return tempId;
  };

  const setTyping = (receiverId, isTyping) => {
    if (socket) {
      socket.emit('typing', {
        senderId: user.id,
        receiverId,
        isTyping,
      });
    }
  };

  const markAsRead = async (senderId) => {
    if (!socket) {return;}

    const chatKey = `user_${senderId}`; // Assuming responder is marking user's messages as read
    const unreadMessages = (chats[chatKey] || []).filter(
      msg => !msg.isOwn && !msg.is_read
    );

    if (unreadMessages.length > 0) {
      try {
        // Update UI optimistically
        setChats(prevChats => ({
          ...prevChats,
          [chatKey]: (prevChats[chatKey] || []).map(msg =>
            !msg.isOwn && !msg.is_read ? { ...msg, is_read: true } : msg
          ),
        }));

        await fetch(`${API_URL}/api/chat/mark-read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            messageIds: unreadMessages.map(msg => msg.id),
          }),
        });

        // Update unread counts
        setUnreadCounts(prev => ({
          ...prev,
          [senderId]: 0,
        }));
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const value = {
    socket,
    activeChat,
    setActiveChat,
    chats,
    typingStatus,
    unreadCounts,
    sendMessage,
    setTyping,
    markAsRead,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
