# Firebase Chat Service

This document provides an overview of the Firebase Chat Service implementation for the Emergency Response application.

## Overview

The Firebase Chat Service provides real-time messaging functionality using Firebase Firestore for data storage and real-time updates. It supports text messages, media uploads, and location sharing.

## Features

- Real-time messaging with read receipts
- Support for text, media, and location messages
- Conversation management
- Unread message tracking
- Typing indicators
- Media uploads to Firebase Storage

## Data Structure

### Conversations Collection

```typescript
interface Conversation {
  id: string;
  participants: string[]; // Sorted array of user IDs
  participantDetails: {
    [userId: string]: {
      name: string;
      role: 'user' | 'responder' | 'admin';
      avatar?: string;
    };
  };
  lastMessage?: Message;
  unreadCount: { [userId: string]: number };
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### Messages Subcollection

```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'user' | 'responder' | 'admin';
  content?: string;
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
  media?: {
    url: string;
    type: string;
    name: string;
    size: number;
  };
  status: 'sent' | 'delivered' | 'read';
  readBy: string[];
  timestamp: FirebaseFirestore.Timestamp;
}
```

## API Endpoints

### Send a Message

**POST** `/api/chat/messages`

Send a new message to a conversation. For new conversations, the first message will create the conversation.

**Request Body:**

```json
{
  "conversationId": "optional-conversation-id",
  "recipientId": "recipient-user-id", // Required for new conversations
  "content": "Hello, this is a test message",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946,
    "name": "Bangalore, India"
  }
  // OR include a file for media messages
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conversationId": "conversation-id",
    "message": {
      "id": "message-id",
      "conversationId": "conversation-id",
      "senderId": "sender-id",
      "content": "Hello, this is a test message",
      "status": "sent",
      "timestamp": "2025-07-02T15:30:00Z"
    }
  }
}
```

### Get Conversation Messages

**GET** `/api/chat/conversations/:conversationId/messages?limit=20&before=message-id`

Retrieve messages from a conversation with pagination.

**Query Parameters:**
- `limit`: Number of messages to retrieve (default: 20)
- `before`: Message ID to retrieve messages before (for pagination)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "message-id",
      "conversationId": "conversation-id",
      "senderId": "sender-id",
      "senderRole": "user",
      "content": "Hello, this is a test message",
      "status": "read",
      "readBy": ["user1", "user2"],
      "timestamp": "2025-07-02T15:30:00Z"
    }
  ]
}
```

### Mark Messages as Read

**POST** `/api/chat/messages/read`

Mark one or more messages as read by the current user.

**Request Body:**

```json
{
  "conversationId": "conversation-id",
  "messageIds": ["message-id-1", "message-id-2"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

### Get User Conversations

**GET** `/api/chat/conversations`

Retrieve all conversations for the current user, ordered by most recent activity.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "conversation-id",
      "participants": ["user1", "user2"],
      "participantDetails": {
        "user1": {
          "name": "Test User",
          "role": "user",
          "avatar": "https://example.com/avatar1.jpg"
        },
        "user2": {
          "name": "Test Responder",
          "role": "responder",
          "avatar": "https://example.com/avatar2.jpg"
        }
      },
      "lastMessage": {
        "id": "message-id",
        "content": "Hello, this is a test message",
        "timestamp": "2025-07-02T15:30:00Z",
        "senderId": "user1",
        "senderRole": "user"
      },
      "unreadCount": {
        "user1": 0,
        "user2": 1
      },
      "createdAt": "2025-07-01T10:00:00Z",
      "updatedAt": "2025-07-02T15:30:00Z"
    }
  ]
}
```

## Real-time Updates

The chat service uses Firestore's real-time listeners to provide instant message delivery and read receipts. To listen for new messages in real-time:

```javascript
import { db } from '../config/firebase';

// Subscribe to new messages in a conversation
const unsubscribe = db.collection('conversations')
  .doc(conversationId)
  .collection('messages')
  .orderBy('timestamp', 'desc')
  .limit(1)
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const message = { id: change.doc.id, ...change.doc.data() };
        console.log('New message:', message);
      }
    });
  });

// Unsubscribe when done
// unsubscribe();
```

## Security Rules

Firebase Security Rules are used to control access to chat data. The rules ensure that:

1. Users can only read/write their own user document
2. Users can only read conversations they are a participant in
3. Only participants can send messages in a conversation
4. Only the message sender can update message status

## Testing

To test the chat service, run the test script:

```bash
node scripts/test-chat-service.js
```

This will:
1. Create test users in Firestore
2. Create a test conversation
3. Send test messages
4. Mark messages as read
5. Retrieve conversation history

## Deployment

1. Ensure Firebase Admin SDK credentials are properly configured
2. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
3. Deploy the backend service

## Monitoring

Monitor chat usage and performance using:
- Firebase Console > Firestore > Usage
- Firebase Console > Storage > Usage
- Firebase Console > Performance
- Cloud Functions logs (if using Firebase Cloud Functions)

## Error Handling

The service includes comprehensive error handling for:
- Invalid input data
- Unauthorized access attempts
- Network issues
- Storage quota exceeded
- Rate limiting
