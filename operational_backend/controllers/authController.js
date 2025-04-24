const { OAuth2Client } = require('google-auth-library');
const admin = require('firebase-admin');
const mysql = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const promisePool = require("../config/db");

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Initialize Firebase Admin SDK (check if already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

// Register user
const registerUser = async (req, res) => {
  let connection;
  try {
    const { firebase_uid, name, phone, password, role, gender } = req.body;

    console.log('Received registration request:', { firebase_uid, name, phone, role, gender });

    if (!firebase_uid || !name || !phone || !password || !gender) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    connection = await promisePool.getConnection();
    await connection.beginTransaction();

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      "SELECT * FROM users WHERE firebase_uid = ? OR phone = ?",
      [firebase_uid, phone]
    );

    if (existingUsers.length > 0) {
      console.log('User already exists:', { firebase_uid, phone });
      await connection.rollback();
      return res.status(400).json({ error: "User already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const query = `
      INSERT INTO users (
        firebase_uid, 
        name, 
        phone, 
        password, 
        role, 
        gender, 
        user_verified
      ) VALUES (?, ?, ?, ?, ?, ?, true)
    `;
    
    const [result] = await connection.execute(query, [
      firebase_uid,
      name,
      phone,
      hashedPassword,
      role || 'user',
      gender
    ]);

    await connection.commit();

    console.log('User registered successfully:', { firebase_uid, name });
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      userId: result.insertId
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Registration Error:", error);
    res.status(500).json({ 
      success: false,
      error: "Registration failed. Please try again." 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Regular user login with password
const loginWithPassword = async (req, res) => {
  let connection;

  try {
    const { phone, password } = req.body;
    console.log('Login request received:', { phone });

    connection = await promisePool.getConnection();

    // Fetch user details from the database
    const [users] = await connection.execute(
      'SELECT id, name, phone, password, role, profile_photo, gender, user_verified FROM users WHERE phone = ?',
      [phone]
    );
    console.log('Fetched user from database:', users);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = users[0];
    
    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send complete response
    return res.json({
      success: true,
      token,
      userId: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      profile_photo: user.profile_photo,
      gender: user.gender,
      user_verified: user.user_verified
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Google Sign-In
const googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'No ID token provided'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { email, name, picture } = ticket.getPayload();

    const [existingUser] = await mysql.promise().execute(
      'SELECT * FROM users WHERE email = ? AND role = "user"',
      [email]
    );
    console.log('Existing user lookup result:', existingUser);

    let userId;
    if (existingUser.length === 0) {
      const [result] = await mysql.promise().execute(
        'INSERT INTO users (name, email, profile_picture, role, user_verified, auth_provider) VALUES (?, ?, ?, "user", true, "google")',
        [name, email, picture]
      );
      userId = result.insertId;
    } else {
      userId = existingUser[0].id;
      await mysql.promise().execute(
        'UPDATE users SET name = ?, profile_picture = ?, last_login = NOW() WHERE id = ?',
        [name, picture, userId]
      );
    }

    const authToken = jwt.sign(
      { 
        id: userId,
        role: 'user',
        name 
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.status(200).json({
      success: true,
      token: authToken,
      userId,
      role: 'user',
      name,
      email,
      picture
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid Google token or authentication failed'
    });
  }
};

// OTP Verification
const verifyOtp = async (req, res) => {
  const { firebase_uid, phone } = req.body;

  console.log('Received OTP verification request:', { firebase_uid, phone });

  if (!firebase_uid || !phone) {
    return res.status(400).json({
      success: false,
      error: "Firebase UID and phone number are required."
    });
  }

  try {
    // Check if user exists
    const [existingUser] = await mysql.promise().execute(
      "SELECT * FROM users WHERE phone = ?",
      [phone]
    );

    console.log('User lookup result:', existingUser);

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found. Please register first."
      });
    }

    // Update firebase_uid if it's different
    if (existingUser[0].firebase_uid !== firebase_uid) {
      await mysql.promise().execute(
        "UPDATE users SET firebase_uid = ?, last_login = NOW() WHERE phone = ?",
        [firebase_uid, phone]
      );
    }

    // Generate token
    const token = jwt.sign(
      {
        id: existingUser[0].id,
        role: 'user',
        name: existingUser[0].name
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const response = {
      success: true,
      token,
      userId: existingUser[0].id,
      role: 'user',
      name: existingUser[0].name
    };

    console.log('Sending response:', response);
    return res.status(200).json(response);

  } catch (error) {
    console.error("OTP Verification Error:", error);
    return res.status(500).json({
      success: false,
      error: "Verification failed. Please try again."
    });
  }
};

// Update the exports
module.exports = {
  registerUser,
  loginWithPassword,
  googleSignIn,
  verifyOtp    // Add this
};