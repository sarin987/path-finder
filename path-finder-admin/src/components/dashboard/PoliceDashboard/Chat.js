import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, Typography, Divider, IconButton, InputBase, Box, Paper, Avatar } from '@mui/material';
import { FaPaperPlane, FaImage } from 'react-icons/fa';
import axios from 'axios';
import socket from '../../../services/socket';
import { deepPurple } from '@mui/material/colors';

const Chat = ({ messages: initialMessages }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(initialMessages || []);
  const messagesEndRef = useRef(null);
  const messagesBoxRef = useRef(null);

  // Helper: Scroll to bottom
  const scrollToBottom = () => {
    if (messagesBoxRef.current) {
      messagesBoxRef.current.scrollTop = messagesBoxRef.current.scrollHeight;
    }
  };

  // Fetch messages from backend
  const fetchMessages = async () => {
    try {
      const response = await axios.get('http://192.168.1.4:5000/api/chat-messages?chat_type=police');
      setMessages(response.data);
      console.log('Fetched chat history:', response.data);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  // Socket join/leave
  useEffect(() => {
    socket.emit('join_chat', { chat_type: 'police', user_id: 0, other_user_id: null });
    return () => {
      socket.emit('leave_chat', { chat_type: 'police', user_id: 0, other_user_id: null });
    };
  }, []);

  // Socket listeners
  useEffect(() => {
    const handleNewMessage = (msg) => {
      console.log('Received chat_message:', msg);
      setMessages((prev) => [...prev, msg]);
    };
    socket.on('chat_message', handleNewMessage);
    return () => {
      socket.off('chat_message', handleNewMessage);
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Refetch on tab focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchMessages();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Poll every 30 seconds as fallback
  useEffect(() => {
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      const msgObj = {
        sender_id: 0, // Police user id
        receiver_id: null, // For group chat. Set to other user's id for 1:1
        message,
        chat_type: 'police',
      };
      console.log('Sending chat_message:', msgObj);
      socket.emit('chat_message', msgObj);
      setMessage('');
    }
  };

  return (
    <Card elevation={3} sx={{ borderRadius: 3, background: '#f4f6fb', minHeight: 420, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, paddingBottom: 0 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#24346D', fontWeight: 700 }}>
          Police Chat
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box ref={messagesBoxRef} sx={{ height: 330, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, pb: 1 }}>
          {messages.length === 0 && (
            <Typography variant="body2" sx={{ color: '#888', textAlign: 'center', mt: 6 }}>
              No messages yet. Start the conversation!
            </Typography>
          )}
          {messages.map((msg, index) => {
            const isOwn = msg.sender_id === 0;
            const senderName = msg.sender_name || (isOwn ? 'Police' : `User ${msg.sender_id}`);
            const senderInitials = senderName.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
            const showAvatar = index === 0 || messages[index-1].sender_id !== msg.sender_id;
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  flexDirection: isOwn ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 1,
                }}
              >
                {showAvatar && (
                  <Avatar sx={{ bgcolor: isOwn ? deepPurple[500] : '#e0e0e0', color: isOwn ? '#fff' : '#222', width: 32, height: 32, fontSize: 18 }}>
                    {senderInitials}
                  </Avatar>
                )}
                <Paper
                  elevation={isOwn ? 2 : 0}
                  sx={{
                    bgcolor: isOwn ? '#4A90E2' : '#fff',
                    color: isOwn ? '#fff' : '#222',
                    borderRadius: 2,
                    borderTopRightRadius: isOwn ? 0 : 2,
                    borderTopLeftRadius: isOwn ? 2 : 0,
                    px: 2,
                    py: 1,
                    maxWidth: '70%',
                    minWidth: 60,
                    fontSize: 16,
                    boxShadow: isOwn ? 3 : 0,
                    border: isOwn ? 'none' : '1px solid #e0e0e0',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isOwn ? '#dbeafe' : '#24346D', mb: 0.5 }}>
                    {showAvatar ? senderName : ''}
                  </Typography>
                  {msg.message}
                  <Typography variant="caption" sx={{ display: 'block', color: isOwn ? '#dbeafe' : '#888', mt: 0.5, textAlign: 'right' }}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    {msg.timestamp && (
                      <>
                        {' • '}
                        {new Date(msg.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' })}
                      </>
                    )}
                  </Typography>
                </Paper>
                {!isOwn && showAvatar && (
                  <Box sx={{ ml: 1 }}>
                    <FaPaperPlane color="#888" size={20} />
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </CardContent>
      <Divider />
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, background: '#fff', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
        <InputBase
          sx={{ ml: 1, flex: 1, fontSize: 16, color: '#24346D' }}
          placeholder="Type a message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
        />
        <IconButton color="primary" sx={{ ml: 1 }} onClick={handleSendMessage}>
          <FaPaperPlane />
        </IconButton>
      </Box>
    </Card>
  );
};

export { Chat };
export default Chat;