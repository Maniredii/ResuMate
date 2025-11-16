import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import db from '../config/database.js';
import { logApiError } from '../utils/logger.js';
import { sanitizeRequestBody } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /profile
 * Get user's profile data
 */
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user profile from database
    const user = db.prepare(`
      SELECT id, name, email, profile_data
      FROM users
      WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User profile not found'
      });
    }

    // Parse profile_data JSON
    let profileData = {};
    if (user.profile_data) {
      try {
        profileData = JSON.parse(user.profile_data);
      } catch (error) {
        console.warn('Failed to parse profile_data:', error);
      }
    }

    res.json({
      profile: {
        personalInfo: {
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          fullName: user.name || '',
          email: user.email || '',
          phone: profileData.phone || '',
          location: {
            streetAddress: profileData.streetAddress || '',
            city: profileData.city || '',
            state: profileData.state || '',
            country: profileData.country || '',
            zipCode: profileData.zipCode || ''
          },
          linkedIn: profileData.linkedIn || '',
          portfolio: profileData.portfolio || '',
          github: profileData.github || ''
        },
        workExperience: {
          currentCompany: profileData.currentCompany || '',
          currentTitle: profileData.currentTitle || '',
          yearsOfExperience: profileData.yearsOfExperience || '',
          previousCompany: profileData.previousCompany || '',
          previousTitle: profileData.previousTitle || ''
        },
        education: {
          degree: profileData.degree || '',
          major: profileData.major || '',
          university: profileData.university || '',
          graduationYear: profileData.graduationYear || ''
        },
        preferences: {
          desiredSalary: profileData.desiredSalary || '',
          willingToRelocate: profileData.willingToRelocate || false,
          requiresSponsorship: profileData.requiresSponsorship || false,
          availableStartDate: profileData.availableStartDate || '',
          workAuthorization: profileData.workAuthorization || ''
        },
        additionalInfo: {
          coverLetterTemplate: profileData.coverLetterTemplate || '',
          customAnswers: profileData.customAnswers || {}
        },
        skills: profileData.skills || [],
        applicationQuestions: {
          speaksEnglish: profileData.speaksEnglish || 'Yes',
          canStartImmediately: profileData.canStartImmediately || '',
          nightShiftAvailable: profileData.nightShiftAvailable || '',
          salaryExpectations: profileData.salaryExpectations || '',
          yearsOfExperience: profileData.yearsOfExperience || '',
          specificSkillYears: profileData.specificSkillYears || {},
          interviewAvailability: profileData.interviewAvailability || '',
          commute: profileData.commute || ''
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    logApiError(error, req, {
      endpoint: '/profile'
    });

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to fetch profile'
    });
  }
});

/**
 * PUT /profile
 * Update user's profile data
 */
router.put('/profile', authenticateToken, sanitizeRequestBody, (req, res) => {
  try {
    const userId = req.user.userId;
    const { profile } = req.body;

    if (!profile) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Profile data is required'
      });
    }

    // Flatten profile data for storage
    const profileData = {
      // Personal Info
      firstName: profile.personalInfo?.firstName || '',
      lastName: profile.personalInfo?.lastName || '',
      phone: profile.personalInfo?.phone || '',
      streetAddress: profile.personalInfo?.location?.streetAddress || '',
      city: profile.personalInfo?.location?.city || '',
      state: profile.personalInfo?.location?.state || '',
      country: profile.personalInfo?.location?.country || '',
      zipCode: profile.personalInfo?.location?.zipCode || '',
      linkedIn: profile.personalInfo?.linkedIn || '',
      portfolio: profile.personalInfo?.portfolio || '',
      github: profile.personalInfo?.github || '',
      
      // Work Experience
      currentCompany: profile.workExperience?.currentCompany || '',
      currentTitle: profile.workExperience?.currentTitle || '',
      yearsOfExperience: profile.workExperience?.yearsOfExperience || '',
      previousCompany: profile.workExperience?.previousCompany || '',
      previousTitle: profile.workExperience?.previousTitle || '',
      
      // Education
      degree: profile.education?.degree || '',
      major: profile.education?.major || '',
      university: profile.education?.university || '',
      graduationYear: profile.education?.graduationYear || '',
      
      // Preferences
      desiredSalary: profile.preferences?.desiredSalary || '',
      willingToRelocate: profile.preferences?.willingToRelocate || false,
      requiresSponsorship: profile.preferences?.requiresSponsorship || false,
      availableStartDate: profile.preferences?.availableStartDate || '',
      workAuthorization: profile.preferences?.workAuthorization || '',
      
      // Additional Info
      coverLetterTemplate: profile.additionalInfo?.coverLetterTemplate || '',
      customAnswers: profile.additionalInfo?.customAnswers || {},
      
      // Skills
      skills: profile.skills || [],
      
      // Application Questions
      speaksEnglish: profile.applicationQuestions?.speaksEnglish || 'Yes',
      canStartImmediately: profile.applicationQuestions?.canStartImmediately || '',
      nightShiftAvailable: profile.applicationQuestions?.nightShiftAvailable || '',
      salaryExpectations: profile.applicationQuestions?.salaryExpectations || '',
      yearsOfExperience: profile.applicationQuestions?.yearsOfExperience || '',
      specificSkillYears: profile.applicationQuestions?.specificSkillYears || {},
      interviewAvailability: profile.applicationQuestions?.interviewAvailability || '',
      commute: profile.applicationQuestions?.commute || ''
    };

    // Update user's name if provided
    const fullName = `${profile.personalInfo?.firstName || ''} ${profile.personalInfo?.lastName || ''}`.trim();
    
    // Update database
    const updateStmt = db.prepare(`
      UPDATE users 
      SET name = ?, profile_data = ?
      WHERE id = ?
    `);

    updateStmt.run(
      fullName || null,
      JSON.stringify(profileData),
      userId
    );

    console.log(`[Profile] Updated profile for user ${userId}`);

    res.json({
      message: 'Profile updated successfully',
      profile: {
        personalInfo: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          fullName: fullName,
          email: req.user.email,
          phone: profileData.phone,
          location: {
            streetAddress: profileData.streetAddress,
            city: profileData.city,
            state: profileData.state,
            country: profileData.country,
            zipCode: profileData.zipCode
          },
          linkedIn: profileData.linkedIn,
          portfolio: profileData.portfolio,
          github: profileData.github
        },
        workExperience: {
          currentCompany: profileData.currentCompany,
          currentTitle: profileData.currentTitle,
          yearsOfExperience: profileData.yearsOfExperience,
          previousCompany: profileData.previousCompany,
          previousTitle: profileData.previousTitle
        },
        education: {
          degree: profileData.degree,
          major: profileData.major,
          university: profileData.university,
          graduationYear: profileData.graduationYear
        },
        preferences: {
          desiredSalary: profileData.desiredSalary,
          willingToRelocate: profileData.willingToRelocate,
          requiresSponsorship: profileData.requiresSponsorship,
          availableStartDate: profileData.availableStartDate,
          workAuthorization: profileData.workAuthorization
        },
        additionalInfo: {
          coverLetterTemplate: profileData.coverLetterTemplate,
          customAnswers: profileData.customAnswers
        },
        skills: profileData.skills,
        applicationQuestions: {
          speaksEnglish: profileData.speaksEnglish,
          canStartImmediately: profileData.canStartImmediately,
          nightShiftAvailable: profileData.nightShiftAvailable,
          salaryExpectations: profileData.salaryExpectations,
          yearsOfExperience: profileData.yearsOfExperience,
          specificSkillYears: profileData.specificSkillYears,
          interviewAvailability: profileData.interviewAvailability,
          commute: profileData.commute
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    logApiError(error, req, {
      endpoint: '/profile',
      method: 'PUT'
    });

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to update profile'
    });
  }
});

/**
 * DELETE /profile
 * Clear user's profile data (keep account)
 */
router.delete('/profile', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    // Clear profile_data but keep user account
    const updateStmt = db.prepare(`
      UPDATE users 
      SET profile_data = NULL
      WHERE id = ?
    `);

    updateStmt.run(userId);

    console.log(`[Profile] Cleared profile for user ${userId}`);

    res.json({
      message: 'Profile data cleared successfully'
    });

  } catch (error) {
    console.error('Delete profile error:', error);
    logApiError(error, req, {
      endpoint: '/profile',
      method: 'DELETE'
    });

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to clear profile'
    });
  }
});

export default router;
