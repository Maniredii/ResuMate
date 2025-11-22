import { callAI } from './ai.service.js';

/**
 * Parse resume into structured sections
 * Extracts: summary, experience, education, skills, projects, certifications
 */
export async function parseResume(resumeText) {
  try {
    const prompt = `You are a resume parser. Analyze the following resume and extract it into structured JSON format.

Resume:
${resumeText}

Extract the following sections:
1. summary - Professional summary or objective
2. experience - Array of work experiences with {company, title, duration, responsibilities[]}
3. education - Array of education with {degree, institution, year, details}
4. skills - Array of technical and soft skills
5. projects - Array of projects with {name, description, technologies[]}
6. certifications - Array of certifications with {name, issuer, year}
7. achievements - Array of notable achievements or awards

Return ONLY valid JSON in this exact format:
{
  "summary": "string",
  "experience": [{"company": "string", "title": "string", "duration": "string", "responsibilities": ["string"]}],
  "education": [{"degree": "string", "institution": "string", "year": "string", "details": "string"}],
  "skills": ["string"],
  "projects": [{"name": "string", "description": "string", "technologies": ["string"]}],
  "certifications": [{"name": "string", "issuer": "string", "year": "string"}],
  "achievements": ["string"]
}`;

    const response = await callAI(prompt, {
      temperature: 0.3, // Lower temperature for more consistent parsing
      maxTokens: 2000
    });

    // Parse JSON response
    const parsed = JSON.parse(response);
    console.log('[Resume Parser] Successfully parsed resume into structured format');
    return parsed;

  } catch (error) {
    console.error('[Resume Parser] Error parsing resume:', error.message);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
}

/**
 * Analyze job description and extract requirements
 * Returns: required skills, preferred skills, responsibilities, qualifications
 */
export async function analyzeJobDescription(jobDescription) {
  try {
    const prompt = `You are a job description analyzer. Analyze the following job posting and extract key requirements.

Job Description:
${jobDescription}

Extract the following information:
1. requiredSkills - Array of must-have technical skills
2. preferredSkills - Array of nice-to-have skills
3. responsibilities - Array of key job responsibilities
4. qualifications - Array of required qualifications (education, experience, etc.)
5. keywords - Array of important keywords for ATS optimization
6. experienceLevel - Required years of experience (e.g., "3-5 years")
7. jobType - Type of role (e.g., "Full-time", "Remote", "Contract")

Return ONLY valid JSON in this exact format:
{
  "requiredSkills": ["string"],
  "preferredSkills": ["string"],
  "responsibilities": ["string"],
  "qualifications": ["string"],
  "keywords": ["string"],
  "experienceLevel": "string",
  "jobType": "string"
}`;

    const response = await callAI(prompt, {
      temperature: 0.3,
      maxTokens: 1500
    });

    const analyzed = JSON.parse(response);
    console.log('[Job Analyzer] Successfully analyzed job description');
    return analyzed;

  } catch (error) {
    console.error('[Job Analyzer] Error analyzing job:', error.message);
    throw new Error(`Failed to analyze job description: ${error.message}`);
  }
}

/**
 * Match resume skills with job requirements
 * Returns: matching skills, missing skills, skill match percentage
 */
export function matchSkills(resumeSkills, jobRequirements) {
  const requiredSkills = jobRequirements.requiredSkills.map(s => s.toLowerCase());
  const preferredSkills = jobRequirements.preferredSkills.map(s => s.toLowerCase());
  const allJobSkills = [...requiredSkills, ...preferredSkills];
  
  const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase());
  
  // Find matching skills
  const matchingRequired = requiredSkills.filter(skill => 
    resumeSkillsLower.some(rs => rs.includes(skill) || skill.includes(rs))
  );
  
  const matchingPreferred = preferredSkills.filter(skill => 
    resumeSkillsLower.some(rs => rs.includes(skill) || skill.includes(rs))
  );
  
  // Find missing skills
  const missingRequired = requiredSkills.filter(skill => 
    !resumeSkillsLower.some(rs => rs.includes(skill) || skill.includes(rs))
  );
  
  const missingPreferred = preferredSkills.filter(skill => 
    !resumeSkillsLower.some(rs => rs.includes(skill) || skill.includes(rs))
  );
  
  // Calculate match percentage
  const totalRequired = requiredSkills.length;
  const matchedRequired = matchingRequired.length;
  const matchPercentage = totalRequired > 0 
    ? Math.round((matchedRequired / totalRequired) * 100) 
    : 100;
  
  return {
    matchingRequired,
    matchingPreferred,
    missingRequired,
    missingPreferred,
    matchPercentage,
    totalRequired,
    matchedRequired
  };
}

/**
 * Intelligently customize resume based on job requirements
 * Uses AI to rewrite sections while maintaining truthfulness
 */
export async function customizeResume(parsedResume, jobRequirements, jobDescription) {
  try {
    console.log('[Resume Customizer] Starting intelligent resume customization...');
    
    // Step 1: Customize professional summary
    const customSummary = await customizeSummary(
      parsedResume.summary,
      jobRequirements,
      parsedResume.experience
    );
    
    // Step 2: Reorder and emphasize relevant experience
    const customExperience = await customizeExperience(
      parsedResume.experience,
      jobRequirements
    );
    
    // Step 3: Optimize skills section
    const customSkills = optimizeSkills(
      parsedResume.skills,
      jobRequirements
    );
    
    // Step 4: Highlight relevant projects
    const customProjects = prioritizeProjects(
      parsedResume.projects,
      jobRequirements
    );
    
    // Step 5: Add relevant keywords throughout
    const keywords = jobRequirements.keywords;
    
    console.log('[Resume Customizer] Successfully customized all sections');
    
    return {
      summary: customSummary,
      experience: customExperience,
      education: parsedResume.education, // Keep education as-is
      skills: customSkills,
      projects: customProjects,
      certifications: parsedResume.certifications, // Keep certifications as-is
      achievements: parsedResume.achievements,
      keywords: keywords
    };
    
  } catch (error) {
    console.error('[Resume Customizer] Error:', error.message);
    throw new Error(`Failed to customize resume: ${error.message}`);
  }
}

/**
 * Customize professional summary to match job requirements
 */
async function customizeSummary(originalSummary, jobRequirements, experience) {
  try {
    const prompt = `You are a professional resume writer. Rewrite the following professional summary to better match the job requirements while staying truthful to the candidate's experience.

Original Summary:
${originalSummary}

Job Requirements:
- Required Skills: ${jobRequirements.requiredSkills.join(', ')}
- Key Responsibilities: ${jobRequirements.responsibilities.slice(0, 3).join(', ')}
- Experience Level: ${jobRequirements.experienceLevel}

Candidate's Experience:
${experience.map(exp => `${exp.title} at ${exp.company}`).join(', ')}

Instructions:
1. Keep the summary concise (3-4 sentences)
2. Emphasize skills that match job requirements
3. Use keywords from the job description
4. Maintain truthfulness - don't add fake experience
5. Make it ATS-friendly with relevant keywords
6. Sound professional and confident

Return ONLY the rewritten summary text, no additional formatting or explanation.`;

    const customized = await callAI(prompt, {
      temperature: 0.7,
      maxTokens: 300
    });

    return customized.trim();

  } catch (error) {
    console.warn('[Summary Customizer] Failed, using original:', error.message);
    return originalSummary;
  }
}

/**
 * Customize work experience to emphasize relevant responsibilities
 */
async function customizeExperience(experiences, jobRequirements) {
  try {
    const customized = [];
    
    for (const exp of experiences) {
      const prompt = `You are a professional resume writer. Rewrite the following work experience to better match the job requirements while staying truthful.

Original Experience:
Company: ${exp.company}
Title: ${exp.title}
Duration: ${exp.duration}
Responsibilities:
${exp.responsibilities.map(r => `- ${r}`).join('\n')}

Job Requirements:
- Required Skills: ${jobRequirements.requiredSkills.join(', ')}
- Key Responsibilities: ${jobRequirements.responsibilities.join(', ')}

Instructions:
1. Rewrite responsibilities to emphasize relevant skills
2. Use action verbs and quantify achievements where possible
3. Incorporate keywords from job requirements naturally
4. Keep it truthful - don't add fake accomplishments
5. Prioritize most relevant responsibilities first
6. Keep each bullet point concise (1-2 lines)

Return ONLY a JSON object with this format:
{
  "responsibilities": ["string", "string", ...]
}`;

      const response = await callAI(prompt, {
        temperature: 0.7,
        maxTokens: 500
      });

      const parsed = JSON.parse(response);
      
      customized.push({
        company: exp.company,
        title: exp.title,
        duration: exp.duration,
        responsibilities: parsed.responsibilities
      });
    }
    
    return customized;

  } catch (error) {
    console.warn('[Experience Customizer] Failed, using original:', error.message);
    return experiences;
  }
}

/**
 * Optimize skills section to prioritize job-relevant skills
 */
function optimizeSkills(skills, jobRequirements) {
  const requiredSkills = jobRequirements.requiredSkills.map(s => s.toLowerCase());
  const preferredSkills = jobRequirements.preferredSkills.map(s => s.toLowerCase());
  
  // Categorize skills
  const matchingRequired = [];
  const matchingPreferred = [];
  const otherSkills = [];
  
  skills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    
    if (requiredSkills.some(req => skillLower.includes(req) || req.includes(skillLower))) {
      matchingRequired.push(skill);
    } else if (preferredSkills.some(pref => skillLower.includes(pref) || pref.includes(skillLower))) {
      matchingPreferred.push(skill);
    } else {
      otherSkills.push(skill);
    }
  });
  
  // Add missing required skills from job if they're common/generic
  const commonSkills = ['Communication', 'Teamwork', 'Problem Solving', 'Time Management'];
  jobRequirements.requiredSkills.forEach(reqSkill => {
    if (commonSkills.some(common => reqSkill.toLowerCase().includes(common.toLowerCase()))) {
      if (!matchingRequired.some(s => s.toLowerCase().includes(reqSkill.toLowerCase()))) {
        matchingRequired.push(reqSkill);
      }
    }
  });
  
  // Return prioritized skills: required first, then preferred, then others
  return [...matchingRequired, ...matchingPreferred, ...otherSkills];
}

/**
 * Prioritize projects that match job requirements
 */
function prioritizeProjects(projects, jobRequirements) {
  if (!projects || projects.length === 0) return [];
  
  const requiredSkills = jobRequirements.requiredSkills.map(s => s.toLowerCase());
  const keywords = jobRequirements.keywords.map(k => k.toLowerCase());
  
  // Score each project based on relevance
  const scoredProjects = projects.map(project => {
    let score = 0;
    const projectText = `${project.name} ${project.description} ${project.technologies.join(' ')}`.toLowerCase();
    
    // Check for required skills
    requiredSkills.forEach(skill => {
      if (projectText.includes(skill)) score += 3;
    });
    
    // Check for keywords
    keywords.forEach(keyword => {
      if (projectText.includes(keyword)) score += 1;
    });
    
    return { ...project, relevanceScore: score };
  });
  
  // Sort by relevance score (highest first)
  scoredProjects.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Remove score before returning
  return scoredProjects.map(({ relevanceScore, ...project }) => project);
}

/**
 * Generate a customized resume document from structured data
 */
export function generateResumeText(customizedResume) {
  let resumeText = '';
  
  // Professional Summary
  if (customizedResume.summary) {
    resumeText += 'PROFESSIONAL SUMMARY\n';
    resumeText += customizedResume.summary + '\n\n';
  }
  
  // Skills
  if (customizedResume.skills && customizedResume.skills.length > 0) {
    resumeText += 'SKILLS\n';
    resumeText += customizedResume.skills.join(' • ') + '\n\n';
  }
  
  // Work Experience
  if (customizedResume.experience && customizedResume.experience.length > 0) {
    resumeText += 'WORK EXPERIENCE\n\n';
    customizedResume.experience.forEach(exp => {
      resumeText += `${exp.title} | ${exp.company}\n`;
      resumeText += `${exp.duration}\n`;
      exp.responsibilities.forEach(resp => {
        resumeText += `• ${resp}\n`;
      });
      resumeText += '\n';
    });
  }
  
  // Projects
  if (customizedResume.projects && customizedResume.projects.length > 0) {
    resumeText += 'PROJECTS\n\n';
    customizedResume.projects.forEach(project => {
      resumeText += `${project.name}\n`;
      resumeText += `${project.description}\n`;
      if (project.technologies && project.technologies.length > 0) {
        resumeText += `Technologies: ${project.technologies.join(', ')}\n`;
      }
      resumeText += '\n';
    });
  }
  
  // Education
  if (customizedResume.education && customizedResume.education.length > 0) {
    resumeText += 'EDUCATION\n\n';
    customizedResume.education.forEach(edu => {
      resumeText += `${edu.degree} | ${edu.institution}\n`;
      resumeText += `${edu.year}\n`;
      if (edu.details) {
        resumeText += `${edu.details}\n`;
      }
      resumeText += '\n';
    });
  }
  
  // Certifications
  if (customizedResume.certifications && customizedResume.certifications.length > 0) {
    resumeText += 'CERTIFICATIONS\n\n';
    customizedResume.certifications.forEach(cert => {
      resumeText += `${cert.name} | ${cert.issuer}`;
      if (cert.year) {
        resumeText += ` | ${cert.year}`;
      }
      resumeText += '\n';
    });
    resumeText += '\n';
  }
  
  // Achievements
  if (customizedResume.achievements && customizedResume.achievements.length > 0) {
    resumeText += 'ACHIEVEMENTS\n\n';
    customizedResume.achievements.forEach(achievement => {
      resumeText += `• ${achievement}\n`;
    });
  }
  
  return resumeText;
}

/**
 * Complete resume customization workflow
 * Parses resume, analyzes job, matches skills, and generates customized resume
 */
export async function intelligentResumeCustomization(resumeText, jobDescription) {
  try {
    console.log('[Intelligent Customization] Starting workflow...');
    
    // Step 1: Parse resume into structured format
    console.log('[Intelligent Customization] Parsing resume...');
    const parsedResume = await parseResume(resumeText);
    
    // Step 2: Analyze job description
    console.log('[Intelligent Customization] Analyzing job description...');
    const jobRequirements = await analyzeJobDescription(jobDescription);
    
    // Step 3: Match skills
    console.log('[Intelligent Customization] Matching skills...');
    const skillMatch = matchSkills(parsedResume.skills, jobRequirements);
    
    // Step 4: Customize resume
    console.log('[Intelligent Customization] Customizing resume sections...');
    const customizedResume = await customizeResume(parsedResume, jobRequirements, jobDescription);
    
    // Step 5: Generate final resume text
    console.log('[Intelligent Customization] Generating final resume...');
    const finalResumeText = generateResumeText(customizedResume);
    
    console.log('[Intelligent Customization] Workflow completed successfully');
    
    return {
      customizedResume: finalResumeText,
      analysis: {
        skillMatch,
        jobRequirements,
        parsedResume
      }
    };
    
  } catch (error) {
    console.error('[Intelligent Customization] Workflow failed:', error.message);
    throw error;
  }
}
