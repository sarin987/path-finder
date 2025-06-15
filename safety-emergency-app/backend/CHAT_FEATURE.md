# Real-time Chat Feature

This document provides an overview of the real-time chat feature implementation in the Safety Emergency App.

## Features

- One-to-one and group chat
- Real-time message delivery
- Typing indicators
- Message read receipts
- Online/offline status
- Message history
- File sharing (images, documents)

## Architecture

The chat feature is built using:

- **Backend**: Node.js with Express and Socket.IO
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO for WebSocket communication
- **Frontend**: React with Socket.IO client

## Database Schema

### Chat Messages

```sql
CREATE TABLE chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(255) NOT NULL,
  sender_id INT NOT NULL,
  receiver_id INT,
  message TEXT,
  message_type ENUM('text', 'image', 'file') DEFAULT 'text',
  file_url VARCHAR(255),
  file_name VARCHAR(255),
  file_size INT,
  file_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_room_id (room_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_receiver_id (receiver_id)
);
```

## API Endpoints

### Chat Messages

- `GET /api/chat/rooms/:roomId/messages` - Get chat history for a room
- `GET /api/chat/conversations` - Get user's conversations
- `POST /api/chat/messages` - Send a new message
- `POST /api/chat/messages/read` - Mark messages as read

## Socket.IO Events

### Client to Server

- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a new message
- `typing` - Notify that user is typing
- `mark_as_read` - Mark messages as read
- `user_online` - Notify when user comes online
- `user_offline` - Notify when user goes offline

### Server to Client

- `new_message` - New message received
- `message_delivered` - Message delivered to server
- `message_read` - Message read by recipient
- `user_typing` - User is typing
- `user_online` - User is online
- `user_offline` - User is offline
- `error` - Error occurred

## Setup Instructions

1. **Environment Variables**

   Copy `.env.example` to `.env` and update the values:

   ```bash
   cp .env.example .env
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Database Setup**

   Make sure your MySQL server is running and update the database credentials in `.env`.

4. **Database Migrations**

   For development:
   ```bash
   # Sync database models (safe, won't drop data)
   npx sequelize-cli db:migrate
   
   # For development with auto schema updates
   ALTER_DB_SYNC=true npm start
   ```

   **Warning**: Be careful with `FORCE_DB_SYNC` as it will drop all tables.

5. **Start the Server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Testing

1. **Unit Tests**

   ```bash
   npm test
   ```

2. **API Testing**

   Use Postman or cURL to test the API endpoints:

   ```bash
   # Get chat history
   curl -X GET http://localhost:5000/api/chat/rooms/room-1/messages \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

   # Send a message
   curl -X POST http://localhost:5000/api/chat/messages \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"roomId":"room-1","receiverId":2,"message":"Hello!"}'
   ```

## Deployment

1. **Production Build**

   ```bash
   npm run build
   ```

2. **Environment**

   Make sure to set `NODE_ENV=production` in your production environment.

3. **Process Manager**

   Use PM2 or similar process manager to keep the application running:

   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name "safety-emergency-api"
   pm2 save
   pm2 startup
   ```

## Monitoring

- Check server logs: `pm2 logs safety-emergency-api`
- Monitor CPU/RAM usage: `pm2 monit`
- API health check: `GET /health`

## Troubleshooting

- **Socket.IO connection issues**: Check CORS settings and WebSocket support
- **Database connection errors**: Verify database credentials and connectivity
- **Authentication failures**: Ensure valid JWT token is provided
- **Message not delivered**: Check if recipient is online and room is joined

## Security Considerations

1. Always use HTTPS in production
2. Validate all user inputs
3. Implement rate limiting
4. Use proper authentication/authorization
5. Sanitize message content to prevent XSS
6. Set appropriate CORS policies
7. Keep dependencies updated

## Future Enhancements

- Message encryption
- Message reactions
- Message editing/deleting
- Read receipts per message
- Typing indicators for group chats
- Message search
- Message pinning
- Message forwarding
- User mentions
- Message threads/replies
