// controllers/messageController.js
const Message = require('../models/Message');
const cloudinary = require('cloudinary').v2;
const db = require('../config/db');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, serviceType, type, content, emergencyProfile } = req.body;
    
    // Map to database structure
    const messageData = {
      conversation_id: serviceType,
      sender_id: senderId,
      message_type: type,
      content: JSON.stringify(content),
      is_read: false
    };

    // Save message to MySQL
    const messageId = await Message.create(messageData);

    // Also save to Firebase
    const db = require('../config/firebase');
    const messagingRef = collection(db, 'messages');
    await addDoc(messagingRef, {
      ...messageData,
      id: messageId,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ message: 'Message sent successfully', messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'emergency-messages',
      resource_type: 'image'
    });

    // Also upload to Firebase Storage
    const storage = require('../config/firebase');
    const uniqueId = new Date().getTime();
    const storageRef = ref(storage, `messages/${uniqueId}`);
    
    await uploadBytes(storageRef, fs.readFileSync(req.file.path));
    const firebaseUrl = await getDownloadURL(storageRef);

    res.status(200).json({
      imageUrl: result.secure_url,
      firebaseUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Get messages from MySQL
    const messages = await Message.findAll({
      where: {
        conversation_id: conversationId
      },
      order: ['created_at', 'DESC'],
      limit: 50
    });

    // Get messages from Firebase
    const db = require('../config/firebase');
    const messagingRef = collection(db, 'messages');
    const q = query(
      messagingRef,
      where('conversation_id', '==', conversationId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    const firebaseMessages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Combine messages and sort by timestamp
    const allMessages = [...messages, ...firebaseMessages]
      .sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at));

    // Format messages to match frontend expectations
    const formattedMessages = allMessages.map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      conversationId: msg.conversation_id,
      type: msg.message_type,
      content: JSON.parse(msg.content),
      isRead: msg.is_read,
      timestamp: msg.timestamp || msg.created_at
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};