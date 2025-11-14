import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate JWT tokens
 * Verifies the token from Authorization header and attaches user info to request
 */
export function authenticateToken(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Access token is required'
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          error: 'Authentication Error',
          message: 'Invalid or expired token'
        });
      }

      // Attach user information to request object
      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };

      next();
    });

  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Authentication failed'
    });
  }
}
