import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { logApiError } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /register
 * Create a new user account
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, email, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid email format'
      });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'Registration Error',
        message: 'User with this email already exists'
      });
    }

    // Hash password with bcrypt (10 salt rounds)
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new user into database
    const insertStmt = db.prepare(`
      INSERT INTO users (name, email, password_hash)
      VALUES (?, ?, ?)
    `);
    
    const result = insertStmt.run(name, email, password_hash);

    // Fetch the created user (excluding password)
    const newUser = db.prepare(`
      SELECT id, name, email, resume_path, profile_data, created_at
      FROM users
      WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Registration error:', error);
    logApiError(error, req, { 
      endpoint: '/register',
      email: req.body?.email 
    });
    
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to register user'
    });
  }
});

/**
 * POST /login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = db.prepare(`
      SELECT id, name, email, password_hash, resume_path, profile_data, created_at
      FROM users
      WHERE email = ?
    `).get(email);

    if (!user) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Invalid email or password'
      });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token with 24-hour expiration
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password_hash from user object
    const { password_hash, ...userData } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    logApiError(error, req, { 
      endpoint: '/login',
      email: req.body?.email 
    });
    
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to login'
    });
  }
});

export default router;
