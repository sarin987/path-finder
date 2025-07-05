import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
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

  // Initialize socket connection
  useEffect(() => {
    if (user?.id) {
      // Use ngrok URL for WebSocket in development
      const wsUrl = __DEV__ 
        ? 'wss://3bf6-2401-4900-881e-1353-d678-d6fc-de47-c356.ngrok-free.app' 
        : API_URL;
      
      const newSocket = io(wsUrl, {
        query: { userId: user.id, role: user.role },
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
      });

      newSocket.on('receive_message', (message) => {
        setChats(prevChats => {
          const chatId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
          const chatKey = `${message.sender_role === 'user' ? 'user_' : 'responder_'}${chatId}`;
          
          return {
            ...prevChats,
            [chatKey]: [
              ...(prevChats[chatKey] || []),
              {
                ...message,
                isOwn: message.sender_id === user.id,
              },
            ],
          };
        });

        // Update unread count if not in active chat
        if (activeChat !== chatId) {
          setUnreadCounts(prev => ({
            ...prev,
            [chatId]: (prev[chatId] || 0) + 1,
          }));
        }
      });

      newSocket.on('user_typing', ({ senderId, isTyping }) => {
        setTypingStatus(prev => ({
          ...prev,
          [senderId]: isTyping,
        }));
      });

      newSocket.on('message_delivered', ({ messageId, timestamp }) => {
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
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user?.id]);

  const sendMessage = (receiverId, message, senderRole = user.role) => {
    if (!socket || !message.trim()) return;

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
        isTyping 
      });
    }
  };

  const markAsRead = async (senderId) => {
    if (!socket) return;
    
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
