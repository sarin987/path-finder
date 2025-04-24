// src/components/common/Chat.js
import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { MessageList, Input } from '@chatscope/chat-ui-kit-react';

const Chat = ({ messages, onSend, onFileUpload }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5>Chat</h5>
      </Card.Header>
      <Card.Body>
        <MessageList
          messages={messages}
          messageStyling={{
            user: {
              backgroundColor: '#007bff',
              color: 'white'
            }
          }}
        />
        <Form.Group className="mb-3">
          <Form.Control
            type="file"
            accept="image/*,video/*"
            onChange={onFileUpload}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
          />
        </Form.Group>
        <Button variant="primary" onClick={handleSend}>
          Send
        </Button>
      </Card.Body>
    </Card>
  );
};

export default Chat;