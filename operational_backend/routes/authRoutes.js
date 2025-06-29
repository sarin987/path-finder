import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Mock user for testing


// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // In a real app, you would validate against the database
    if (email !== mockUser.email || password !== mockUser.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: mockUser.id, role: mockUser.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    // In a real app, you would create a new user in the database
    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
