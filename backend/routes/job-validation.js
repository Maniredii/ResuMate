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
  matchSkills
} from '../services/resume-parser.service.js';
import {
  readResumeContent
} from '../services/document.service.js';

const router = express.Router();

/**
 * POST /validate-skills
 * Validate if user has matching skills for a job before applying
 * Returns skill match analysis and recommendation
 */
router.post('/validate-skills', authenticateToken, sanitizeRequestBody, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const userId = req.user.userId;

    if (!jobDescription) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Job description is required'
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
        message: 'Please upload a resume before validating skills'
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

    console.log('[Skill Validation] Starting validation process...');

    // Step 1: Read and parse resume
    const resumeText = await readResumeContent(resumePath);
    const parsedResume = await parseResume(resumeText);
    console.log(`[Skill Validation] Parsed resume - Found ${parsedResume.skills.length} skills`);

    // Step 2: Parse profile data for additional skills
    let profileSkills = [];
    if (user.profile_data) {
      try {
        const profileData = JSON.parse(user.profile_data);
        profileSkills = profileData.skills || [];
      } catch (error) {
        console.warn('[Skill Validation] Could not parse profile_data');
      }
    }

    // Combine resume skills and profile skills
    const allUserSkills = [...new Set([...parsedResume.skills, ...profileSkills])];
    console.log(`[Skill Validation] Total user skills (resume + profile): ${allUserSkills.length}`);

    // Step 3: Analyze job description
    const jobRequirements = await analyzeJobDescription(jobDescription);
    console.log(`[Skill Validation] Job requires ${jobRequirements.requiredSkills.length} skills`);

    // Step 4: Match skills
    const skillMatch = matchSkills(allUserSkills, jobRequirements);
    console.log(`[Skill Validation] Match percentage: ${skillMatch.matchPercentage}%`);

    // Step 5: Determine if user can apply
    const hasAnyMatch = skillMatch.matchingRequired.length > 0 || skillMatch.matchingPreferred.length > 0;
    const canApply = hasAnyMatch;
    const shouldWarn = skillMatch.matchPercentage < 50;

    // Step 6: Generate recommendation
    let recommendation = '';
    let recommendationType = '';

    if (skillMatch.matchPercentage >= 75) {
      recommendation = `Excellent match! You have ${skillMatch.matchPercentage}% of required skills. You're a strong candidate for this position.`;
      recommendationType = 'excellent';
    } else if (skillMatch.matchPercentage >= 50) {
      recommendation = `Good match! You have ${skillMatch.matchPercentage}% of required skills. Consider highlighting your relevant experience.`;
      recommendationType = 'good';
    } else if (skillMatch.matchPercentage >= 25) {
      recommendation = `Moderate match. You have ${skillMatch.matchPercentage}% of required skills. You may want to emphasize transferable skills.`;
      recommendationType = 'moderate';
    } else if (hasAnyMatch) {
      recommendation = `Low match. You have only ${skillMatch.matchingRequired.length} of ${skillMatch.totalRequired} required skills. Consider if this role aligns with your experience.`;
      recommendationType = 'low';
    } else {
      recommendation = `No matching skills found. This position requires skills you don't currently have listed. Consider gaining experience in: ${jobRequirements.requiredSkills.slice(0, 3).join(', ')}`;
      recommendationType = 'none';
    }

    // Return validation result
    res.json({
      canApply,
      shouldWarn,
      validation: {
        matchPercentage: skillMatch.matchPercentage,
        matchingRequired: skillMatch.matchingRequired,
        matchingPreferred: skillMatch.matchingPreferred,
        missingRequired: skillMatch.missingRequired,
        missingPreferred: skillMatch.missingPreferred,
        totalRequired: skillMatch.totalRequired,
        matchedRequired: skillMatch.matchedRequired,
        userSkills: allUserSkills,
        jobRequiredSkills: jobRequirements.requiredSkills,
        jobPreferredSkills: jobRequirements.preferredSkills
      },
      recommendation: {
        message: recommendation,
        type: recommendationType
      },
      jobInfo: {
        experienceLevel: jobRequirements.experienceLevel,
        jobType: jobRequirements.jobType,
        keywords: jobRequirements.keywords
      }
    });

  } catch (error) {
    console.error('[Skill Validation] Error:', error);
    logApiError(error, req, {
      endpoint: '/validate-skills'
    });

    res.status(500).json({
      error: 'Validation Error',
      message: `Failed to validate skills: ${error.message}`
    });
  }
});

/**
 * POST /check-job-match
 * Quick check if user matches job requirements (lighter version)
 * Used for quick validation before full application
 */
router.post('/check-job-match', authenticateToken, sanitizeRequestBody, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const userId = req.user.userId;

    if (!jobDescription) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Job description is required'
      });
    }

    // Get user profile data
    const user = db.prepare(`
      SELECT profile_data
      FROM users
      WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User Error',
        message: 'User not found'
      });
    }

    // Get user skills from profile
    let userSkills = [];
    if (user.profile_data) {
      try {
        const profileData = JSON.parse(user.profile_data);
        userSkills = profileData.skills || [];
      } catch (error) {
        console.warn('[Job Match Check] Could not parse profile_data');
      }
    }

    if (userSkills.length === 0) {
      return res.json({
        hasMatch: false,
        message: 'No skills found in your profile. Please update your profile with your skills.',
        matchPercentage: 0
      });
    }

    // Analyze job description
    const jobRequirements = await analyzeJobDescription(jobDescription);

    // Quick skill match
    const skillMatch = matchSkills(userSkills, jobRequirements);

    res.json({
      hasMatch: skillMatch.matchingRequired.length > 0,
      matchPercentage: skillMatch.matchPercentage,
      matchingSkills: skillMatch.matchingRequired.length,
      totalRequired: skillMatch.totalRequired,
      message: skillMatch.matchPercentage >= 50 
        ? 'Good match! You have relevant skills for this position.'
        : skillMatch.matchingRequired.length > 0
        ? 'Partial match. Some of your skills align with this position.'
        : 'No matching skills found for this position.'
    });

  } catch (error) {
    console.error('[Job Match Check] Error:', error);
    logApiError(error, req, {
      endpoint: '/check-job-match'
    });

    res.status(500).json({
      error: 'Check Error',
      message: `Failed to check job match: ${error.message}`
    });
  }
});

export default router;
