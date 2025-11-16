import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { logApiError } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /ai/generate-answer
 * Generate AI-powered answer for application questions
 */
router.post('/generate-answer', authenticateToken, async (req, res) => {
  try {
    const { question, jobDescription, userProfile } = req.body;

    if (!question) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Question is required'
      });
    }

    // Simple AI-like response generation (you can integrate with OpenAI/Gemini later)
    const answer = generateAnswer(question, jobDescription, userProfile);

    res.json({
      answer,
      generated: true
    });

  } catch (error) {
    console.error('AI generate answer error:', error);
    logApiError(error, req, {
      endpoint: '/ai/generate-answer'
    });

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to generate answer'
    });
  }
});

/**
 * Generate answer based on question type and context
 */
function generateAnswer(question, jobDescription = '', userProfile = {}) {
  const questionLower = question.toLowerCase();
  
  // Extract company name from job description if available
  const companyMatch = jobDescription.match(/(?:at|for|with)\s+([A-Z][a-zA-Z\s&]+?)(?:\s|,|\.|\n)/);
  const companyName = companyMatch ? companyMatch[1].trim() : 'your company';
  
  // Extract role/position from job description
  const roleMatch = jobDescription.match(/(?:position|role|job):\s*([^\n]+)/i) || 
                    jobDescription.match(/^([^\n]+)/);
  const roleName = roleMatch ? roleMatch[1].trim() : 'this position';
  
  // Get user info
  const userName = userProfile.personalInfo?.firstName || 'I';
  const experience = userProfile.workExperience?.yearsOfExperience || 'several years';
  const currentTitle = userProfile.workExperience?.currentTitle || 'professional';
  const skills = userProfile.skills?.join(', ') || 'relevant skills';

  // Why this company?
  if (questionLower.includes('why') && (questionLower.includes('company') || questionLower.includes('us') || questionLower.includes('here'))) {
    return `I am excited about the opportunity to join ${companyName} because of your reputation for innovation and excellence in the industry. Your company's commitment to ${extractKeywords(jobDescription)} aligns perfectly with my professional values and career goals. I believe my ${experience} of experience and expertise in ${skills} would allow me to contribute meaningfully to your team's success.`;
  }
  
  // Why this role/position?
  if (questionLower.includes('why') && (questionLower.includes('role') || questionLower.includes('position') || questionLower.includes('job') || questionLower.includes('interested'))) {
    return `I am particularly interested in ${roleName} because it aligns perfectly with my background as a ${currentTitle} and my ${experience} of experience. The responsibilities outlined in the job description, especially ${extractKeywords(jobDescription)}, match my core competencies and passion. I am excited about the opportunity to apply my skills in ${skills} to drive results and grow professionally in this role.`;
  }
  
  // What can you bring/contribute?
  if (questionLower.includes('bring') || questionLower.includes('contribute') || questionLower.includes('offer')) {
    return `I bring ${experience} of hands-on experience as a ${currentTitle}, with a proven track record in ${skills}. My background has equipped me with strong problem-solving abilities, attention to detail, and the capacity to work effectively both independently and as part of a team. I am confident that my technical expertise and dedication to excellence will enable me to make immediate and lasting contributions to ${companyName}.`;
  }
  
  // Why should we hire you?
  if (questionLower.includes('hire') || questionLower.includes('choose')) {
    return `You should hire me because I combine ${experience} of relevant experience with a genuine passion for ${extractKeywords(jobDescription)}. My background as a ${currentTitle} has prepared me to excel in this role, and I have consistently demonstrated my ability to deliver results, adapt to new challenges, and collaborate effectively with diverse teams. I am committed to contributing to ${companyName}'s success and growing alongside the organization.`;
  }
  
  // Where do you see yourself in 5 years?
  if (questionLower.includes('5 year') || questionLower.includes('five year') || questionLower.includes('future')) {
    return `In five years, I see myself as a senior contributor at ${companyName}, having grown both professionally and technically. I aim to deepen my expertise in ${skills}, take on increasing responsibilities, and potentially mentor junior team members. I am committed to long-term growth with an organization that values innovation and professional development, and I believe ${companyName} provides the perfect environment for achieving these goals.`;
  }
  
  // Greatest strength
  if (questionLower.includes('strength') || questionLower.includes('strong')) {
    return `My greatest strength is my ability to combine technical expertise with strong problem-solving skills. Throughout my ${experience} of experience as a ${currentTitle}, I have consistently demonstrated my capacity to analyze complex challenges, develop effective solutions, and deliver high-quality results. I am also known for my attention to detail, reliability, and ability to collaborate effectively with cross-functional teams.`;
  }
  
  // Greatest weakness
  if (questionLower.includes('weakness') || questionLower.includes('improve')) {
    return `I tend to be very detail-oriented, which sometimes means I spend extra time ensuring everything is perfect. However, I have been actively working on balancing thoroughness with efficiency by setting clear priorities and deadlines. I have also learned to recognize when "good enough" is appropriate versus when perfection is truly necessary, which has helped me become more productive while maintaining high standards.`;
  }
  
  // Why leaving current job?
  if (questionLower.includes('leaving') || questionLower.includes('change')) {
    return `I am seeking new opportunities to grow professionally and take on new challenges. While I have valued my time in my current role, I am excited about the possibility of joining ${companyName} because of your reputation for ${extractKeywords(jobDescription)} and the opportunity to work on more diverse and impactful projects. I believe this role aligns better with my long-term career goals and will allow me to make greater contributions.`;
  }
  
  // Handle specific skill/tool questions
  if (questionLower.includes('experience with') || questionLower.includes('familiar with') || questionLower.includes('knowledge of')) {
    const toolMatch = question.match(/(?:experience with|familiar with|knowledge of)\s+([^?]+)/i);
    const tool = toolMatch ? toolMatch[1].trim() : 'the required technologies';
    return `Yes, I have ${experience} of experience working with ${tool}. In my role as a ${currentTitle}, I have extensively used ${tool} to deliver successful projects. I am proficient in its core features and best practices, and I continuously stay updated with the latest developments in this technology.`;
  }
  
  // Handle availability questions
  if (questionLower.includes('available') || questionLower.includes('start date') || questionLower.includes('when can you start')) {
    const noticePeriod = userProfile.applicationQuestions?.noticePeriod || '2 weeks';
    return `I am available to start after a ${noticePeriod} notice period. I am excited about this opportunity and committed to ensuring a smooth transition from my current role. If needed, I can discuss flexibility in the start date to accommodate the team's needs.`;
  }
  
  // Handle salary questions
  if (questionLower.includes('salary') || questionLower.includes('compensation') || questionLower.includes('pay')) {
    const expectedSalary = userProfile.applicationQuestions?.expectedSalary || 'competitive market rate';
    return `My salary expectations are ${expectedSalary}, though I am open to discussion based on the complete compensation package, including benefits, growth opportunities, and work environment. I am primarily focused on finding the right fit where I can contribute meaningfully and grow professionally.`;
  }
  
  // Handle relocation questions
  if (questionLower.includes('relocate') || questionLower.includes('relocation') || questionLower.includes('move')) {
    const willingToRelocate = userProfile.preferences?.willingToRelocate;
    if (willingToRelocate) {
      return `Yes, I am willing to relocate for the right opportunity. I am excited about the possibility of joining ${companyName} and am prepared to make the necessary arrangements to ensure a smooth transition. I view relocation as an opportunity for both professional growth and personal development.`;
    } else {
      return `I am currently not looking to relocate, but I am very interested in this position and would be happy to discuss remote work options or other arrangements that could make this opportunity work for both parties.`;
    }
  }
  
  // Handle team/collaboration questions
  if (questionLower.includes('team') || questionLower.includes('collaborate') || questionLower.includes('work with others')) {
    return `I thrive in collaborative environments and have ${experience} of experience working effectively in diverse teams. As a ${currentTitle}, I have successfully collaborated with cross-functional teams, communicated complex ideas clearly, and contributed to a positive team culture. I believe in open communication, mutual respect, and collective problem-solving to achieve shared goals.`;
  }
  
  // Handle challenge/problem-solving questions
  if (questionLower.includes('challenge') || questionLower.includes('difficult') || questionLower.includes('problem')) {
    return `Throughout my ${experience} as a ${currentTitle}, I have encountered and successfully resolved numerous challenges. I approach problems systematically by first understanding the root cause, exploring multiple solutions, and implementing the most effective approach. One of my key strengths is remaining calm under pressure and viewing challenges as opportunities to learn and improve.`;
  }
  
  // Handle achievement questions
  if (questionLower.includes('achievement') || questionLower.includes('accomplish') || questionLower.includes('proud')) {
    return `One of my proudest achievements in my ${experience} as a ${currentTitle} was successfully leading projects that delivered significant value. I take pride in my ability to consistently meet deadlines, exceed expectations, and contribute to team success. My attention to detail and commitment to quality have resulted in recognition from both colleagues and management.`;
  }
  
  // Handle learning/growth questions
  if (questionLower.includes('learn') || questionLower.includes('develop') || questionLower.includes('grow')) {
    return `I am committed to continuous learning and professional development. Throughout my career as a ${currentTitle}, I have actively sought opportunities to expand my skills in ${skills} and stay current with industry trends. I believe that joining ${companyName} would provide excellent opportunities for growth, and I am eager to learn from experienced team members while contributing my own expertise.`;
  }
  
  // Handle work style questions
  if (questionLower.includes('work style') || questionLower.includes('describe yourself') || questionLower.includes('type of person')) {
    return `I would describe myself as a dedicated and detail-oriented ${currentTitle} with ${experience} of experience. I am proactive, self-motivated, and thrive in both independent and collaborative settings. I value clear communication, continuous improvement, and delivering high-quality work. My colleagues often describe me as reliable, professional, and someone who brings positive energy to the team.`;
  }
  
  // Handle "tell us about yourself"
  if (questionLower.includes('about yourself') || questionLower.includes('introduce yourself') || questionLower.includes('background')) {
    const education = userProfile.education?.degree || 'relevant education';
    return `I am a ${currentTitle} with ${experience} of professional experience and a background in ${education}. Throughout my career, I have developed strong expertise in ${skills} and have consistently delivered results in fast-paced environments. I am passionate about ${extractKeywords(jobDescription)} and am excited about the opportunity to bring my skills and experience to ${companyName}.`;
  }
  
  // Generic intelligent response for ANY other question
  return generateGenericAnswer(question, companyName, roleName, experience, currentTitle, skills, jobDescription, userProfile);
}

/**
 * Generate a generic but intelligent answer for any question
 */
function generateGenericAnswer(question, companyName, roleName, experience, currentTitle, skills, jobDescription, userProfile) {
  // Analyze question to determine best response approach
  const questionLower = question.toLowerCase();
  
  // If question asks "how"
  if (questionLower.includes('how')) {
    return `Based on my ${experience} of experience as a ${currentTitle}, I approach this by leveraging my expertise in ${skills}. I believe in systematic problem-solving, clear communication, and continuous improvement. My track record demonstrates my ability to deliver results effectively while maintaining high standards of quality.`;
  }
  
  // If question asks "what"
  if (questionLower.includes('what')) {
    return `In my role as a ${currentTitle} with ${experience} of experience, I have developed strong capabilities in ${skills}. I am committed to delivering exceptional results and contributing to team success. I believe my background and expertise align well with the requirements of ${roleName} at ${companyName}.`;
  }
  
  // If question asks "describe" or "explain"
  if (questionLower.includes('describe') || questionLower.includes('explain')) {
    return `Throughout my ${experience} as a ${currentTitle}, I have consistently demonstrated proficiency in ${skills}. I am detail-oriented, results-driven, and committed to excellence. My approach combines technical expertise with strong communication and collaboration skills, enabling me to contribute effectively to ${companyName}'s goals.`;
  }
  
  // Default comprehensive answer
  return `I am highly motivated to join ${companyName} and contribute to ${roleName}. With my ${experience} of experience as a ${currentTitle} and expertise in ${skills}, I am confident in my ability to excel in this role. I am passionate about ${extractKeywords(jobDescription)} and committed to delivering exceptional results while continuously learning and growing professionally. I believe my background, skills, and dedication make me a strong fit for this position.`;
}

/**
 * Extract key themes/keywords from job description
 */
function extractKeywords(jobDescription) {
  if (!jobDescription || jobDescription.length < 20) {
    return 'innovation and excellence';
  }
  
  const keywords = [
    'innovation', 'technology', 'collaboration', 'growth', 'excellence',
    'quality', 'customer satisfaction', 'teamwork', 'leadership', 'development'
  ];
  
  const found = keywords.filter(keyword => 
    jobDescription.toLowerCase().includes(keyword)
  );
  
  if (found.length > 0) {
    return found.slice(0, 2).join(' and ');
  }
  
  return 'innovation and excellence';
}

export default router;
