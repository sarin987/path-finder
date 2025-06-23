import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  CircularProgress
} from '@mui/material';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';

// Define the message interface
interface Message {
  id: string | number;
  sender_id: string;
  receiver_id: string | number;  // Can be string or number to handle both local and server data
  sender_role: 'user' | 'responder';
  message: string;
  timestamp: string;
  is_read: boolean;
  isOwn?: boolean;
  senderName?: string;
}

const ChatPage: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();
  if (!user) {
    throw new Error('User must be authenticated to access chat');
  }
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  
  // Update mobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mock user list (replace with actual user list from your API)
  const users = [
    { id: '1', name: 'User 1' },
    { id: '2', name: 'User 2' },
    { id: '3', name: 'User 3' },
  ] as const;

  // Initialize socket connection
  useEffect(() => {
    // Socket connection
    const socket = io(config.API_URL, {
      query: { 
        userId: user.id.toString(), 
        role: 'responder' // This is the responder portal
      },
      transports: ['websocket']
    });

    socketRef.current = socket;

    // Set up event listeners
    socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    socket.on('receive_message', (message: Message) => {
      setMessages(prev => [
        ...prev,
        {
          ...message,
          isOwn: message.sender_id === user.id,
          senderName: message.sender_role === 'user' ? 'User' : 'You'
        }
      ]);
    });

    socket.on('user_typing', ({ from, isTyping }) => {
      if (from !== user.id) {
        // Handle typing indicator
        console.log(`User ${from} is typing: ${isTyping}`);
      }
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user?.id]);

  // Handle receiver selection
  const handleSelectReceiver = useCallback(async (userId: string | number) => {
    const userIdStr = userId.toString();  // Ensure we're using string ID
    setReceiverId(userIdStr);
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessages([]);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socketRef.current || !receiverId) return;

    const messageData = {
      senderId: user.id,
      receiverId,
      senderRole: 'responder' as const,
      message: newMessage.trim()
    };

    // Optimistic UI update
    const tempId = Date.now();
    const newMsg: Message = {
      id: tempId,
      sender_id: user.id,  // This should be a number based on the Message interface
      receiver_id: receiverId,
      sender_role: 'responder',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      is_read: false,
      isOwn: true,
      senderName: 'You'
    };
    
    setMessages(prev => [...prev, newMsg]);

    // Send message through socket
    socketRef.current.emit('send_message', messageData);
    setNewMessage('');
  };

  const handleTyping = useCallback((typing: boolean) => {
    if (!socketRef.current || !receiverId) return;
    
    socketRef.current.emit('typing', { 
      from: user.id, 
      to: receiverId, 
      isTyping: typing 
    });
    
    if (typing) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 2000);
    }
  }, [receiverId, user.id]);

  // Format message timestamp


  return (
    <Box sx={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'background.default',
      zIndex: 1,
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2,
        backgroundColor: 'background.paper',
        boxShadow: 1,
        zIndex: 1,
        position: 'sticky',
        top: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        height: '64px',
        boxSizing: 'border-box',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" component="h1">
          {receiverId ? `Chat with User #${receiverId}` : 'Select a user to start chatting'}
        </Typography>
        {isLoading && <CircularProgress size={24} />}
      </Box>
      
      {/* Main Content */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'background.default'
      }}>
        {!receiverId ? (
          <Box sx={{ 
            flex: 1, 
            overflowY: 'auto',
            p: 2
          }}>
            <Typography variant="h6" color="text.secondary" align="center" sx={{ mt: 4 }}>
              Select a user to start chatting
            </Typography>
            <List>
              {users.map((user) => (
                <ListItem 
                  key={user.id} 
                  button 
                  onClick={() => handleSelectReceiver(user.id)}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Typography>{user.name}</Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        ) : (
          <>
            {/* Chat messages area */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              {messages.map((message, index) => (
                <Box 
                  key={message.id || index}
                  sx={{
                    display: 'flex',
                    justifyContent: message.isOwn ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: message.isOwn ? 'primary.main' : 'background.paper',
                      color: message.isOwn ? 'primary.contrastText' : 'text.primary',
                      p: 1.5,
                      borderRadius: 2,
                      maxWidth: '70%',
                      boxShadow: 1
                    }}
                  >
                    <Typography variant="body1">{message.message}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'right' }}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message input */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              width: '100%',
              maxWidth: '800px',
              mx: 'auto',
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                onKeyDown={() => handleTyping(true)}
                size="small"
                autoComplete="off"
                disabled={!receiverId}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 4,
                    backgroundColor: 'background.paper',
                    '&.Mui-focused fieldset': {
                      borderWidth: '1px !important'
                    },
                  },
                }}
                inputProps={{
                  style: {
                    height: isMobile ? '36px' : 'auto',
                    padding: isMobile ? '8px 12px' : '10px 16px'
                  }
                }}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !receiverId}
                sx={{ 
                  borderRadius: 4,
                  minWidth: isMobile ? 'auto' : '80px',
                  px: isMobile ? 2 : 3,
                  height: isMobile ? '36px' : '40px',
                  whiteSpace: 'nowrap',
                  '&.Mui-disabled': {
                    backgroundColor: 'action.disabledBackground',
                    color: 'text.disabled',
                    boxShadow: 'none'
                  },
                  '&:hover': {
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }
                }}
              >
                Send
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

// Add default export at the end
export default ChatPage;
