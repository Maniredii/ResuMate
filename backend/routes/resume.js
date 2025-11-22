import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { sanitizeRequestBody } from '../middleware/validation.js';
import db from '../config/database.js';
import { logApiError } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';
import {
  parseResume,
  analyzeJobDescription,
  matchSkills,
  intelligentResumeCustomization
} from '../services/resume-parser.service.js';
import {
  readResumeContent,
  updateResumeContent
} from '../services/document.service.js';

const router = express.Router();

/**
 * POST /analyze-resume
 * Parse and analyze user's resume
 */
router.post('/analyze-resume', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's resume
    const user = db.prepare(`
      SELECT resume_path
      FROM users
      WHERE id = ?
    `).get(userId);

    if (!user || !user.resume_path) {
      return res.status(404).json({
        error: 'Resume Not Found',
        message: 'Please upload a resume first'
      });
    }

    const resumePath = path.resolve(process.cwd(), user.resume_path);
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({
        error: 'File Not Found',
        message: 'Resume file does not exist'
      });
    }

    // Read resume content
    const resumeText = await readResumeContent(resumePath);

    // Parse resume
    const parsedResume = await parseResume(resumeText);

    res.json({
      message: 'Resume analyzed successfully',
      analysis: parsedResume
    });

  } catch (error) {
    console.error('Analyze resume error:', error);
    logApiError(error, req, {
      endpoint: '/analyze-resume'
    });

    res.status(500).json({
      error: 'Analysis Error',
      message: `Failed to analyze resume: ${error.message}`
    });
  }
});

/**
 * POST /analyze-job
 * Analyze job description and extract requirements
 */
router.post('/analyze-job', authenticateToken, sanitizeRequestBody, async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Job description is required'
      });
    }

    // Analyze job description
    const analysis = await analyzeJobDescription(jobDescription);

    res.json({
      message: 'Job description analyzed successfully',
      analysis
    });

  } catch (error) {
    console.error('Analyze job error:', error);
    logApiError(error, req, {
      endpoint: '/analyze-job'
    });

    res.status(500).json({
      error: 'Analysis Error',
      message: `Failed to analyze job description: ${error.message}`
    });
  }
});

/**
 * POST /match-skills
 * Match resume skills with job requirements
 */
router.post('/match-skills', authenticateToken, sanitizeRequestBody, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const userId = req.user.userId;

    if (!jobDescription) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Job description is required'
      });
    }

    // Get user's resume
    const user = db.prepare(`
      SELECT resume_path
      FROM users
      WHERE id = ?
    `).get(userId);

    if (!user || !user.resume_path) {
      return res.status(404).json({
        error: 'Resume Not Found',
        message: 'Please upload a resume first'
      });
    }

    const resumePath = path.resolve(process.cwd(), user.resume_path);
    const resumeText = await readResumeContent(resumePath);

    // Parse resume and analyze job
    const parsedResume = await parseResume(resumeText);
    const jobRequirements = await analyzeJobDescription(jobDescription);

    // Match skills
    const skillMatch = matchSkills(parsedResume.skills, jobRequirements);

    res.json({
      message: 'Skills matched successfully',
      match: {
        ...skillMatch,
        recommendations: generateRecommendations(skillMatch, jobRequirements)
      },
      jobRequirements: {
        requiredSkills: jobRequirements.requiredSkills,
        preferredSkills: jobRequirements.preferredSkills,
        experienceLevel: jobRequirements.experienceLevel
      }
    });

  } catch (error) {
    console.error('Match skills error:', error);
    logApiError(error, req, {
      endpoint: '/match-skills'
    });

    res.status(500).json({
      error: 'Matching Error',
      message: `Failed to match skills: ${error.message}`
    });
  }
});

/**
 * POST /customize-resume
 * Intelligently customize resume for a specific job
 */
router.post('/customize-resume', authenticateToken, sanitizeRequestBody, async (req, res) => {
  try {
    const { jobDescription, saveToFile = true } = req.body;
    const userId = req.user.userId;

    if (!jobDescription) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Job description is required'
      });
    }

    // Get user's resume
    const user = db.prepare(`
      SELECT resume_path
      FROM users
      WHERE id = ?
    `).get(userId);

    if (!user || !user.resume_path) {
      return res.status(404).json({
        error: 'Resume Not Found',
        message: 'Please upload a resume first'
      });
    }

    const resumePath = path.resolve(process.cwd(), user.resume_path);
    const resumeText = await readResumeContent(resumePath);

    // Perform intelligent customization
    const result = await intelligentResumeCustomization(resumeText, jobDescription);

    // Optionally save to file
    if (saveToFile) {
      await updateResumeContent(resumePath, result.customizedResume);
      console.log('[Resume Customization] Updated resume file');
    }

    res.json({
      message: 'Resume customized successfully',
      customizedResume: result.customizedResume,
      analysis: {
        skillMatchPercentage: result.analysis.skillMatch.matchPercentage,
        matchingSkills: result.analysis.skillMatch.matchingRequired,
        missingSkills: result.analysis.skillMatch.missingRequired,
        recommendations: generateRecommendations(
          result.analysis.skillMatch,
          result.analysis.jobRequirements
        )
      },
      saved: saveToFile
    });

  } catch (error) {
    console.error('Customize resume error:', error);
    logApiError(error, req, {
      endpoint: '/customize-resume'
    });

    res.status(500).json({
      error: 'Customization Error',
      message: `Failed to customize resume: ${error.message}`
    });
  }
});

/**
 * POST /preview-customization
 * Preview resume customization without saving
 */
router.post('/preview-customization', authenticateToken, sanitizeRequestBody, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const userId = req.user.userId;

    if (!jobDescription) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Job description is required'
      });
    }

    // Get user's resume
    const user = db.prepare(`
      SELECT resume_path
      FROM users
      WHERE id = ?
    `).get(userId);

    if (!user || !user.resume_path) {
      return res.status(404).json({
        error: 'Resume Not Found',
        message: 'Please upload a resume first'
      });
    }

    const resumePath = path.resolve(process.cwd(), user.resume_path);
    const resumeText = await readResumeContent(resumePath);

    // Perform intelligent customization (without saving)
    const result = await intelligentResumeCustomization(resumeText, jobDescription);

    res.json({
      message: 'Preview generated successfully',
      original: resumeText,
      customized: result.customizedResume,
      changes: {
        skillMatchPercentage: result.analysis.skillMatch.matchPercentage,
        matchingSkills: result.analysis.skillMatch.matchingRequired.length,
        missingSkills: result.analysis.skillMatch.missingRequired.length,
        totalRequired: result.analysis.skillMatch.totalRequired
      },
      analysis: {
        skillMatch: result.analysis.skillMatch,
        jobRequirements: result.analysis.jobRequirements,
        recommendations: generateRecommendations(
          result.analysis.skillMatch,
          result.analysis.jobRequirements
        )
      }
    });

  } catch (error) {
    console.error('Preview customization error:', error);
    logApiError(error, req, {
      endpoint: '/preview-customization'
    });

    res.status(500).json({
      error: 'Preview Error',
      message: `Failed to generate preview: ${error.message}`
    });
  }
});

/**
 * Generate recommendations based on skill match
 */
function generateRecommendations(skillMatch, jobRequirements) {
  const recommendations = [];

  // Skill match recommendations
  if (skillMatch.matchPercentage < 50) {
    recommendations.push({
      type: 'warning',
      message: `Low skill match (${skillMatch.matchPercentage}%). Consider gaining experience in: ${skillMatch.missingRequired.slice(0, 3).join(', ')}`
    });
  } else if (skillMatch.matchPercentage < 75) {
    recommendations.push({
      type: 'info',
      message: `Moderate skill match (${skillMatch.matchPercentage}%). Highlight your experience with: ${skillMatch.matchingRequired.slice(0, 3).join(', ')}`
    });
  } else {
    recommendations.push({
      type: 'success',
      message: `Strong skill match (${skillMatch.matchPercentage}%)! You're a great fit for this role.`
    });
  }

  // Missing skills recommendations
  if (skillMatch.missingRequired.length > 0) {
    recommendations.push({
      type: 'action',
      message: `Consider adding these skills to your resume if you have them: ${skillMatch.missingRequired.join(', ')}`
    });
  }

  // Experience level recommendations
  if (jobRequirements.experienceLevel) {
    recommendations.push({
      type: 'info',
      message: `Required experience: ${jobRequirements.experienceLevel}. Make sure your resume clearly shows your years of experience.`
    });
  }

  // Keyword optimization
  if (jobRequirements.keywords && jobRequirements.keywords.length > 0) {
    recommendations.push({
      type: 'tip',
      message: `Use these keywords in your resume for ATS optimization: ${jobRequirements.keywords.slice(0, 5).join(', ')}`
    });
  }

  return recommendations;
}

export default router;
