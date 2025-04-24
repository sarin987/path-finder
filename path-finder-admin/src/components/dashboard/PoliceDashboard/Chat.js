import React, { useState } from 'react';
import { Card, CardContent, TextField, IconButton, Typography } from '@mui/material';
import { FaPaperPlane } from 'react-icons/fa';
import socket from '../../../services/socket';

const Chat = ({ messages }) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      socket.emit('sendMessage', {
        text: message,
        timestamp: new Date(),
        sender: 'police'
      });
      setMessage('');
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Chat
        </Typography>
        <div className="h-[400px] overflow-y-auto mb-4">
          {messages.map((msg, index) => (
            <div key={index} className={`p-2 mb-2 ${msg.sender === 'police' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'}`}>
              <Typography variant="body1">
                {msg.text}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {new Date(msg.timestamp).toLocaleString()}
              </Typography>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <TextField
            fullWidth
            variant="outlined"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <IconButton onClick={handleSendMessage} color="primary">
            <FaPaperPlane />
          </IconButton>
        </div>
      </CardContent>
    </Card>
  );
};

export { Chat };
export default Chat;