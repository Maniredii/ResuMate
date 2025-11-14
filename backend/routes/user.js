import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import db from '../config/database.js';

const router = express.Router();

/**
 * GET /get-user
 * Fetch authenticated user's profile data
 * Requires authentication middleware
 */
router.get('/get-user', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch user data from database by user ID
    const user = db.prepare(`
      SELECT id, name, email, resume_path, profile_data, created_at
      FROM users
      WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User Error',
        message: 'User not found'
      });
    }

    // Parse profile_data JSON field if it exists
    let parsedProfileData = null;
    if (user.profile_data) {
      try {
        parsedProfileData = JSON.parse(user.profile_data);
      } catch (error) {
        console.warn('Failed to parse profile_data for user:', userId, error);
        // Keep parsedProfileData as null if parsing fails
      }
    }

    // Return user profile excluding password hash
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        resume_path: user.resume_path,
        profile_data: parsedProfileData,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to fetch user profile'
    });
  }
});

export default router;
