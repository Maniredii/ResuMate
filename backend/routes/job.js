import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import db from '../config/database.js';
import { scrapeJobDescription, scrapeLinkedInJob } from '../services/scraper.service.js';
import { tailorResume } from '../services/ai.service.js';
import { autoApply } from '../services/autoapply.service.js';
import { logApiError } from '../utils/logger.js';
import { 
  validateJobUrlMiddleware, 
  sanitizeRequestBody 
} from '../middleware/validation.js';
import {
  readResumeContent,
  updateResumeContent,
  createResumeBackup
} from '../services/document.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * POST /apply-job
 * Complete job application workflow:
 * 1. Extract job description from URL
 * 2. Tailor user's resume using AI
 * 3. Submit application via auto-apply
 * 4. Save application record to database
 */
router.post('/apply-job', 
  authenticateToken, 
  sanitizeRequestBody,
  validateJobUrlMiddleware,
  async (req, res) => {
  try {
    const { jobUrl } = req.body;
    const userId = req.user.userId;

    // Get user data from database
    const user = db.prepare(`
      SELECT id, name, email, resume_path, profile_data
      FROM users
      WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User Error',
        message: 'User not found'
      });
    }

    // Check if user has uploaded a resume
    if (!user.resume_path) {
      return res.status(400).json({
        error: 'Resume Error',
        message: 'Please upload a resume before applying to jobs'
      });
    }

    // Verify resume file exists
    const resumePath = path.resolve(process.cwd(), user.resume_path);
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({
        error: 'Resume Error',
        message: 'Resume file not found. Please upload your resume again.'
      });
    }

    // Step 1: Call scraper service to extract job description
    let jobData;
    try {
      console.log(`[Job Application] Scraping job description from: ${jobUrl}`);
      jobData = await scrapeJobDescription(jobUrl);
      console.log(`[Job Application] Successfully scraped job: ${jobData.title} at ${jobData.company}`);
    } catch (error) {
      console.error('[Job Application] Scraper failed:', error.message);
      
      // Log scraper error
      logApiError(error, req, {
        endpoint: '/apply-job',
        step: 'scrapeJobDescription',
        jobUrl: jobUrl
      });
      
      // Determine appropriate status code based on error type
      let statusCode = 500;
      let userMessage = error.message;
      let details = 'Please verify the job URL is correct and the job posting is still active.';
      
      if (error.message.includes('Unsupported job platform')) {
        statusCode = 400;
        details = 'Currently, only Indeed and Wellfound job postings are supported.';
      } else if (error.message.includes('Timeout') || error.message.includes('30 seconds')) {
        statusCode = 504;
        details = 'The job page took too long to load. Please try again or check if the URL is accessible.';
      } else if (error.message.includes('Network error') || error.message.includes('net::')) {
        statusCode = 503;
        details = 'Unable to reach the job posting website. Please check your internet connection and try again.';
      } else if (error.message.includes('Invalid job URL')) {
        statusCode = 400;
        details = 'The provided URL is not valid. Please provide a complete job posting URL.';
      }
      
      return res.status(statusCode).json({
        error: 'Scraper Error',
        message: `Failed to extract job description: ${userMessage}`,
        details: details
      });
    }

    // Step 2: Create backup of original resume (first time only)
    try {
      await createResumeBackup(resumePath);
    } catch (error) {
      console.warn('[Job Application] Could not create backup:', error.message);
      // Continue anyway - backup is optional
    }

    // Step 3: Read user's resume from file system (supports .docx and .txt)
    let originalResume;
    try {
      originalResume = await readResumeContent(resumePath);
      console.log('[Job Application] Resume read successfully');
    } catch (error) {
      return res.status(500).json({
        error: 'File Error',
        message: `Failed to read resume file: ${error.message}`
      });
    }

    // Step 4: Call AI service to tailor resume
    let tailoredResumeText;
    try {
      console.log('[Job Application] Tailoring resume with AI service...');
      tailoredResumeText = await tailorResume(originalResume, jobData.description);
      console.log('[Job Application] Resume tailored successfully');
    } catch (error) {
      console.error('[Job Application] AI service failed:', error.message);
      
      // Log AI service error
      logApiError(error, req, {
        endpoint: '/apply-job',
        step: 'tailorResume',
        jobUrl: jobUrl
      });
      
      // Determine appropriate status code and user-friendly message
      let statusCode = 500;
      let userMessage = error.message;
      let details = 'Please check your AI provider configuration and API key.';
      
      if (error.message.includes('API key not found')) {
        statusCode = 500;
        details = 'AI service is not properly configured. Please set up your API key in the environment variables.';
      } else if (error.message.includes('Invalid AI provider')) {
        statusCode = 500;
        details = 'The configured AI provider is not supported. Please use openai, groq, openrouter, or gemini.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        statusCode = 500;
        details = 'Your AI API key is invalid or expired. Please update your API key in the settings.';
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        statusCode = 429;
        details = 'AI service rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message.includes('No response received')) {
        statusCode = 503;
        details = 'Unable to connect to the AI service. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        statusCode = 504;
        details = 'AI service request timed out. Please try again.';
      }
      
      return res.status(statusCode).json({
        error: 'AI Service Error',
        message: `Failed to tailor resume: ${userMessage}`,
        details: details
      });
    }

    // Step 5: Update the existing resume file in place (saves space)
    try {
      await updateResumeContent(resumePath, tailoredResumeText);
      console.log('[Job Application] Resume updated in place');
    } catch (error) {
      return res.status(500).json({
        error: 'File Error',
        message: `Failed to update resume file: ${error.message}`
      });
    }

    // Step 6: Prepare user data for auto-apply
    let profileData = {};
    if (user.profile_data) {
      try {
        profileData = JSON.parse(user.profile_data);
      } catch (error) {
        console.warn('Failed to parse profile_data:', error);
      }
    }

    const userData = {
      name: user.name,
      email: user.email,
      phone: profileData.phone || '',
      location: profileData.location || '',
      ...profileData
    };

    // Step 7: Call auto-apply service to submit application (using updated resume)
    let applyResult;
    try {
      console.log('[Job Application] Attempting to auto-apply to job...');
      applyResult = await autoApply(jobUrl, userData, resumePath);
      console.log(`[Job Application] Auto-apply result: ${applyResult.success ? 'Success' : 'Failed'} - ${applyResult.message}`);
    } catch (error) {
      console.error('[Job Application] Auto-apply failed:', error.message);
      
      // Log auto-apply error
      logApiError(error, req, {
        endpoint: '/apply-job',
        step: 'autoApply',
        jobUrl: jobUrl
      });
      
      // Determine user-friendly error message
      let userMessage = error.message;
      let details = 'The resume was tailored successfully but the automatic submission failed. You may need to apply manually using the tailored resume.';
      let statusCode = 500;
      
      if (error.message.includes('Unsupported job platform')) {
        statusCode = 400;
        details = 'Auto-apply is only supported for Indeed and Wellfound. Please apply manually to this job.';
      } else if (error.message.includes('Could not find Apply button')) {
        statusCode = 422;
        details = 'Unable to locate the application form on this job page. The page structure may have changed or the job may require login.';
      } else if (error.message.includes('Could not find Submit button')) {
        statusCode = 422;
        details = 'Unable to complete the application form. Some required fields may be missing or the form structure is not recognized.';
      } else if (error.message.includes('Timeout') || error.message.includes('timeout')) {
        statusCode = 504;
        details = 'The application process took too long. The job site may be slow or unresponsive. Please try again later.';
      } else if (error.message.includes('authentication') || error.message.includes('login')) {
        statusCode = 401;
        details = 'This job requires you to be logged in to the platform. Please apply manually after logging in.';
      }
      
      // Log error to database with status "error"
      try {
        const insertStmt = db.prepare(`
          INSERT INTO job_applications (user_id, job_link, job_description, tailored_resume_path, status)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        insertStmt.run(
          userId,
          jobUrl,
          jobData.description,
          relativeTailoredPath,
          'error'
        );
        console.log('[Job Application] Error logged to database with status "error"');
      } catch (dbError) {
        console.error('[Job Application] Failed to log error to database:', dbError.message);
        logApiError(dbError, req, {
          endpoint: '/apply-job',
          step: 'logErrorToDatabase',
          jobUrl: jobUrl
        });
      }

      return res.status(statusCode).json({
        error: 'Auto-Apply Error',
        message: `Failed to submit application: ${userMessage}`,
        details: details,
        tailoredResumePath: relativeTailoredPath // Provide path so user can apply manually
      });
    }

    // Step 7: Insert application record into job_applications table
    const status = applyResult.success ? 'applied' : 'error';
    
    try {
      const insertStmt = db.prepare(`
        INSERT INTO job_applications (user_id, job_link, job_description, tailored_resume_path, status)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const result = insertStmt.run(
        userId,
        jobUrl,
        jobData.description,
        relativeTailoredPath,
        status
      );

      // Fetch the created application record
      const application = db.prepare(`
        SELECT id, user_id, job_link, job_description, tailored_resume_path, status, applied_at
        FROM job_applications
        WHERE id = ?
      `).get(result.lastInsertRowid);

      // Step 8: Return success response with application details
      // If auto-apply failed but we got here, return 207 Multi-Status (partial success)
      const responseStatus = applyResult.success ? 201 : 207;
      
      res.status(responseStatus).json({
        message: applyResult.success 
          ? 'Application submitted successfully' 
          : 'Resume tailored successfully, but automatic submission failed',
        application: {
          ...application,
          jobTitle: jobData.title,
          company: jobData.company,
          platform: jobData.platform
        },
        applyResult,
        ...(applyResult.success ? {} : {
          details: 'Your tailored resume has been saved. You can apply manually using the tailored resume.',
          tailoredResumePath: relativeTailoredPath
        })
      });
    } catch (dbError) {
      console.error('[Job Application] Database error while saving application:', dbError.message);
      
      // Log database error
      logApiError(dbError, req, {
        endpoint: '/apply-job',
        step: 'saveApplicationToDatabase',
        jobUrl: jobUrl
      });
      
      // Even if database save fails, the application may have been submitted
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to save application record to database',
        details: applyResult.success 
          ? 'Your application was submitted but we could not save the record. Please check your application history on the job platform.'
          : 'Failed to save application details. Please try again.',
        applyResult
      });
    }

  } catch (error) {
    console.error('[Job Application] Unexpected workflow error:', error);
    
    // Log detailed error for debugging
    console.error('Error stack:', error.stack);
    
    // Log unexpected workflow error
    logApiError(error, req, {
      endpoint: '/apply-job',
      step: 'unexpectedError',
      jobUrl: req.body?.jobUrl
    });
    
    // Determine if this is a database error
    let statusCode = 500;
    let userMessage = 'An unexpected error occurred while processing your job application.';
    let details = 'Please try again. If the problem persists, contact support.';
    
    if (error.message && error.message.includes('database')) {
      details = 'A database error occurred. Please ensure the application is properly configured.';
    } else if (error.message && error.message.includes('ENOENT')) {
      statusCode = 500;
      details = 'A required file or directory was not found. Please check your file uploads.';
    } else if (error.message && error.message.includes('EACCES')) {
      statusCode = 500;
      details = 'Permission denied accessing a required file or directory.';
    }
    
    res.status(statusCode).json({
      error: 'Server Error',
      message: userMessage,
      details: details
    });
  }
});

/**
 * POST /scrape-linkedin
 * Scrape LinkedIn job and generate PDF report with skill analysis
 */
router.post('/scrape-linkedin',
  authenticateToken,
  sanitizeRequestBody,
  validateJobUrlMiddleware,
  async (req, res) => {
  try {
    const { jobUrl } = req.body;
    const userId = req.user.userId;

    // Validate LinkedIn URL
    if (!jobUrl.toLowerCase().includes('linkedin.com')) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid LinkedIn job URL'
      });
    }

    // Get user's resume for skill comparison
    const user = db.prepare(`
      SELECT resume_path
      FROM users
      WHERE id = ?
    `).get(userId);

    let userResume = '';
    if (user && user.resume_path) {
      const resumePath = path.resolve(process.cwd(), user.resume_path);
      if (fs.existsSync(resumePath)) {
        try {
          userResume = fs.readFileSync(resumePath, 'utf-8');
        } catch (error) {
          console.warn('Could not read user resume:', error.message);
        }
      }
    }

    // Scrape LinkedIn job and generate PDF
    console.log(`[LinkedIn Scraper] Scraping job from: ${jobUrl}`);
    const jobData = await scrapeLinkedInJob(jobUrl, userResume);
    console.log(`[LinkedIn Scraper] Successfully scraped: ${jobData.title} at ${jobData.company}`);

    // Return job data and PDF path
    res.json({
      message: 'LinkedIn job scraped successfully',
      jobData: {
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        description: jobData.description,
        requiredSkills: jobData.requiredSkills,
        missingSkills: jobData.missingSkills,
        platform: jobData.platform,
        url: jobData.url
      },
      pdfPath: jobData.pdfPath,
      pdfUrl: `/api/job/download-report/${path.basename(jobData.pdfPath)}`
    });

  } catch (error) {
    console.error('[LinkedIn Scraper] Error:', error.message);
    logApiError(error, req, {
      endpoint: '/scrape-linkedin',
      jobUrl: req.body?.jobUrl
    });

    let statusCode = 500;
    let details = 'Please verify the LinkedIn job URL is correct and accessible.';

    if (error.message.includes('Timeout')) {
      statusCode = 504;
      details = 'The LinkedIn page took too long to load. Please try again.';
    } else if (error.message.includes('Network error')) {
      statusCode = 503;
      details = 'Unable to reach LinkedIn. Please check your internet connection.';
    }

    res.status(statusCode).json({
      error: 'LinkedIn Scraper Error',
      message: error.message,
      details
    });
  }
});

/**
 * GET /download-report/:filename
 * Download generated PDF report
 */
router.get('/download-report/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    const reportsDir = path.join(process.cwd(), 'backend', 'uploads', 'reports');
    const filepath = path.join(reportsDir, filename);

    // Security check: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        error: 'Invalid filename',
        message: 'Filename contains invalid characters'
      });
    }

    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested report does not exist'
      });
    }

    // Send file
    res.download(filepath, filename, (error) => {
      if (error) {
        console.error('Error downloading file:', error);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Download Error',
            message: 'Failed to download report'
          });
        }
      }
    });

  } catch (error) {
    console.error('Download report error:', error);
    logApiError(error, req, {
      endpoint: '/download-report'
    });

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to download report'
    });
  }
});

/**
 * GET /application-history
 * Fetch authenticated user's job application history
 * Requires authentication middleware
 */
router.get('/application-history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    // Query job_applications table filtered by user_id
    // Sort results by applied_at descending (most recent first)
    const applications = db.prepare(`
      SELECT id, user_id, job_link, job_description, tailored_resume_path, status, applied_at
      FROM job_applications
      WHERE user_id = ?
      ORDER BY applied_at DESC
    `).all(userId);

    // Return array of application records
    res.json({
      applications,
      count: applications.length
    });

  } catch (error) {
    console.error('Get application history error:', error);
    logApiError(error, req, {
      endpoint: '/application-history'
    });
    
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to fetch application history'
    });
  }
});

export default router;
