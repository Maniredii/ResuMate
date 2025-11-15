import express from 'express';
import { uploadResume, uploadDocument } from '../config/multer.js';
import { authenticateToken } from '../middleware/auth.js';
import db from '../config/database.js';
import { logApiError } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /upload-resume
 * Upload user's resume and store file path in database
 * Requires authentication
 */
router.post('/upload-resume', authenticateToken, uploadResume.single('resume'), (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a resume file to upload' 
      });
    }

    const userId = req.user.userId;
    const filePath = req.file.path;

    // Update user's resume_path in database
    const stmt = db.prepare('UPDATE users SET resume_path = ? WHERE id = ?');
    const result = stmt.run(filePath, userId);

    if (result.changes === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Could not update resume path' 
      });
    }

    // Return uploaded file information
    res.status(200).json({
      message: 'Resume uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: filePath,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    logApiError(error, req, { 
      endpoint: '/upload-resume',
      fileName: req.file?.originalname 
    });
    
    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
});

/**
 * POST /upload-document
 * Upload user's document (certificate, etc.) and store in database
 * Requires authentication
 */
router.post('/upload-document', authenticateToken, uploadDocument.single('document'), (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a document file to upload' 
      });
    }

    const userId = req.user.userId;
    const filePath = req.file.path;
    const fileType = req.body.fileType || 'other'; // Get file type from request body

    // Insert document record into database
    const stmt = db.prepare(
      'INSERT INTO documents (user_id, file_path, file_type) VALUES (?, ?, ?)'
    );
    const result = stmt.run(userId, filePath, fileType);

    if (result.changes === 0) {
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Could not save document record' 
      });
    }

    // Return uploaded file information
    res.status(200).json({
      message: 'Document uploaded successfully',
      document: {
        id: result.lastInsertRowid,
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: filePath,
        size: req.file.size,
        mimetype: req.file.mimetype,
        fileType: fileType
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    logApiError(error, req, { 
      endpoint: '/upload-document',
      fileName: req.file?.originalname,
      fileType: req.body?.fileType 
    });
    
    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
});

/**
 * GET /documents
 * Fetch all documents for authenticated user
 * Requires authentication
 */
router.get('/documents', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch all documents for the user
    const documents = db.prepare(`
      SELECT id, file_path, file_type, uploaded_at
      FROM documents
      WHERE user_id = ?
      ORDER BY uploaded_at DESC
    `).all(userId);

    res.status(200).json({
      documents: documents.map(doc => ({
        id: doc.id,
        filePath: doc.file_path,
        fileName: doc.file_path.split(/[\\/]/).pop(), // Extract filename from path
        fileType: doc.file_type,
        uploadedAt: doc.uploaded_at
      }))
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    logApiError(error, req, { 
      endpoint: '/documents'
    });
    
    res.status(500).json({ 
      error: 'Fetch failed',
      message: error.message 
    });
  }
});

/**
 * GET /view-resume
 * Download/view the authenticated user's resume
 * Requires authentication
 */
router.get('/view-resume', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's resume path from database
    const user = db.prepare(`
      SELECT resume_path
      FROM users
      WHERE id = ?
    `).get(userId);

    if (!user || !user.resume_path) {
      return res.status(404).json({
        error: 'Resume not found',
        message: 'No resume has been uploaded yet'
      });
    }

    // Import required modules
    import('path').then(pathModule => {
      import('fs').then(fsModule => {
        const path = pathModule.default;
        const fs = fsModule.default;

        // Resolve the file path
        const resumePath = path.resolve(process.cwd(), user.resume_path);

        // Check if file exists
        if (!fs.existsSync(resumePath)) {
          return res.status(404).json({
            error: 'File not found',
            message: 'Resume file does not exist on server'
          });
        }

        // Get filename for download
        const filename = path.basename(resumePath);

        // Set headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        // Stream the file
        const fileStream = fs.createReadStream(resumePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
          console.error('Error streaming resume:', error);
          if (!res.headersSent) {
            res.status(500).json({
              error: 'Stream error',
              message: 'Failed to stream resume file'
            });
          }
        });
      });
    });

  } catch (error) {
    console.error('Error viewing resume:', error);
    logApiError(error, req, { 
      endpoint: '/view-resume'
    });
    
    res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
});

/**
 * GET /download-resume
 * Download the authenticated user's resume
 * Requires authentication
 */
router.get('/download-resume', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's resume path from database
    const user = db.prepare(`
      SELECT resume_path
      FROM users
      WHERE id = ?
    `).get(userId);

    if (!user || !user.resume_path) {
      return res.status(404).json({
        error: 'Resume not found',
        message: 'No resume has been uploaded yet'
      });
    }

    // Import required modules
    import('path').then(pathModule => {
      import('fs').then(fsModule => {
        const path = pathModule.default;
        const fs = fsModule.default;

        // Resolve the file path
        const resumePath = path.resolve(process.cwd(), user.resume_path);

        // Check if file exists
        if (!fs.existsSync(resumePath)) {
          return res.status(404).json({
            error: 'File not found',
            message: 'Resume file does not exist on server'
          });
        }

        // Get filename for download
        const filename = path.basename(resumePath);

        // Send file as download
        res.download(resumePath, filename, (error) => {
          if (error) {
            console.error('Error downloading resume:', error);
            if (!res.headersSent) {
              res.status(500).json({
                error: 'Download error',
                message: 'Failed to download resume file'
              });
            }
          }
        });
      });
    });

  } catch (error) {
    console.error('Error downloading resume:', error);
    logApiError(error, req, { 
      endpoint: '/download-resume'
    });
    
    res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
});

export default router;
