import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizeFilename } from '../middleware/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File type validation - whitelist PDF and DOCX
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'), false);
  }
};

// Storage configuration for resumes
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/resumes'));
  },
  filename: (req, file, cb) => {
    const userId = req.user?.userId || 'unknown';
    const timestamp = Date.now();
    const sanitizedName = sanitizeFilename(file.originalname);
    cb(null, `${userId}_${timestamp}_${sanitizedName}`);
  }
});

// Storage configuration for tailored resumes
const tailoredStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/tailored'));
  },
  filename: (req, file, cb) => {
    const userId = req.user?.userId || 'unknown';
    const timestamp = Date.now();
    const sanitizedName = sanitizeFilename(file.originalname);
    cb(null, `${userId}_${timestamp}_${sanitizedName}`);
  }
});

// Storage configuration for documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/documents'));
  },
  filename: (req, file, cb) => {
    const userId = req.user?.userId || 'unknown';
    const timestamp = Date.now();
    const sanitizedName = sanitizeFilename(file.originalname);
    cb(null, `${userId}_${timestamp}_${sanitizedName}`);
  }
});

// Multer instances with 10MB file size limit
export const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

export const uploadTailored = multer({
  storage: tailoredStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});
