import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import uploadRoutes from './routes/upload.js';
import jobRoutes from './routes/job.js';
import profileRoutes from './routes/profile.js';
import aiRoutes from './routes/ai.js';
import { logApiError, logError } from './utils/logger.js';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Configure middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Mount route handlers
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Job Application Automation API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handling middleware for uncaught errors
app.use((err, req, res, next) => {
  console.error('Uncaught error:', err);
  
  // Log all API errors
  logApiError(err, req, {
    errorType: 'UNCAUGHT_ERROR',
    errorCode: err.code
  });
  
  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File Too Large',
      message: 'File size exceeds the 10MB limit'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Invalid File',
      message: 'Unexpected file field in upload'
    });
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    error: 'Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize database and start server
try {
  console.log('Initializing database...');
  initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`✓ Server is running on http://localhost:${PORT}`);
    console.log(`✓ API endpoints available at http://localhost:${PORT}/api`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ AI Provider: ${process.env.AI_PROVIDER || 'not configured'}`);
    console.log(`✓ Logs directory: backend/logs/`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  logError(error, {
    context: 'server_startup',
    port: PORT
  });
  process.exit(1);
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
