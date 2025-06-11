import express from 'express';
<<<<<<< HEAD

const router = express.Router();

// Basic user routes placeholder
router.get('/profile', (req, res) => {
  res.json({ success: true, message: 'User profile endpoint' });
});

=======
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../database/connection';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  preferences: z.object({
    categories: z.array(z.enum(['sports', 'music', 'theater', 'family'])).optional(),
    venues: z.array(z.string()).optional(),
    maxPrice: z.number().positive().optional(),
    minSavings: z.number().min(0).max(100).optional(),
    alertMethods: z.array(z.enum(['email', 'sms', 'push'])).optional()
  }).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// User Registration
router.post('/register', async (req, res) => {
  try {
    const userData = registerSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: userData.email }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Create user
    const user = await db.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        subscription: 'free',
        preferences: userData.preferences || {},
        isActive: true,
        createdAt: new Date()
      }
    });
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscription: user.subscription,
        preferences: user.preferences
      },
      token
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Find user
    const user = await db.user.findUnique({
      where: { email }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
    
    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscription: user.subscription,
        preferences: user.preferences
      },
      token
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get User Profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscription: true,
        preferences: true,
        createdAt: true,
        lastLogin: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update User Preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const preferencesSchema = z.object({
      categories: z.array(z.enum(['sports', 'music', 'theater', 'family'])).optional(),
      venues: z.array(z.string()).optional(),
      maxPrice: z.number().positive().optional(),
      minSavings: z.number().min(0).max(100).optional(),
      alertMethods: z.array(z.enum(['email', 'sms', 'push'])).optional(),
      phoneNumber: z.string().optional()
    });
    
    const preferences = preferencesSchema.parse(req.body);
    
    const updatedUser = await db.user.update({
      where: { id: req.user.userId },
      data: { preferences }
    });
    
    res.json({
      success: true,
      preferences: updatedUser.preferences
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    console.error('Preferences update error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Authentication middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

>>>>>>> 1cab5437522ec66ec90fcb67dd3e3a14510935b2
export default router;
