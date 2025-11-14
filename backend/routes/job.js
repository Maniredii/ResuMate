import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import db from '../config/database.js';
import { scrapeJobDescription } from '../services/scraper.service.js';
import { tailorResume } from '../services/ai.service.js';
import { autoApply } from '../services/autoapply.service.js';

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
router.post('/apply-job', authenticateToken, async (req, res) => {
  try {
    const { jobUrl } = req.body;
    const userId = req.user.userId;

    // Validate job URL
    if (!jobUrl || typeof jobUrl !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Job URL is required'
      });
    }

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
      return res.status(500).json({
        error: 'Scraper Error',
        message: `Failed to extract job description: ${error.message}`,
        details: 'Please verify the job URL is correct and the job posting is still active.'
      });
    }

    // Step 2: Read user's resume from file system
    let originalResume;
    try {
      originalResume = fs.readFileSync(resumePath, 'utf-8');
    } catch (error) {
      return res.status(500).json({
        error: 'File Error',
        message: `Failed to read resume file: ${error.message}`
      });
    }

    // Step 3: Call AI service to tailor resume
    let tailoredResumeText;
    try {
      console.log('[Job Application] Tailoring resume with AI service...');
      tailoredResumeText = await tailorResume(originalResume, jobData.description);
      console.log('[Job Application] Resume tailored successfully');
    } catch (error) {
      console.error('[Job Application] AI service failed:', error.message);
      return res.status(500).json({
        error: 'AI Service Error',
        message: `Failed to tailor resume: ${error.message}`,
        details: 'Please check your AI provider configuration and API key.'
      });
    }

    // Step 4: Save tailored resume to uploads/tailored directory
    const tailoredDir = path.join(process.cwd(), 'backend', 'uploads', 'tailored');
    
    // Ensure tailored directory exists
    if (!fs.existsSync(tailoredDir)) {
      fs.mkdirSync(tailoredDir, { recursive: true });
    }

    const timestamp = Date.now();
    const tailoredFileName = `${userId}_${timestamp}_tailored.txt`;
    const tailoredFilePath = path.join(tailoredDir, tailoredFileName);
    const relativeTailoredPath = path.join('backend', 'uploads', 'tailored', tailoredFileName);

    try {
      fs.writeFileSync(tailoredFilePath, tailoredResumeText, 'utf-8');
    } catch (error) {
      return res.status(500).json({
        error: 'File Error',
        message: `Failed to save tailored resume: ${error.message}`
      });
    }

    // Step 5: Prepare user data for auto-apply
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

    // Step 6: Call auto-apply service to submit application
    let applyResult;
    try {
      console.log('[Job Application] Attempting to auto-apply to job...');
      applyResult = await autoApply(jobUrl, userData, tailoredFilePath);
      console.log(`[Job Application] Auto-apply result: ${applyResult.success ? 'Success' : 'Failed'} - ${applyResult.message}`);
    } catch (error) {
      console.error('[Job Application] Auto-apply failed:', error.message);
      
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
        console.log('[Job Application] Error logged to database');
      } catch (dbError) {
        console.error('[Job Application] Failed to log error to database:', dbError.message);
      }

      return res.status(500).json({
        error: 'Auto-Apply Error',
        message: `Failed to submit application: ${error.message}`,
        details: 'The resume was tailored successfully but the automatic submission failed. You may need to apply manually.'
      });
    }

    // Step 7: Insert application record into job_applications table
    const status = applyResult.success ? 'applied' : 'error';
    
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
    res.status(201).json({
      message: applyResult.success 
        ? 'Application submitted successfully' 
        : 'Application workflow completed but submission failed',
      application: {
        ...application,
        jobTitle: jobData.title,
        company: jobData.company,
        platform: jobData.platform
      },
      applyResult
    });

  } catch (error) {
    console.error('Job application workflow error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to process job application'
    });
  }
});

export default router;
