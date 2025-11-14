import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Service for resume tailoring and skill extraction
 * Supports multiple AI providers: OpenAI, Groq, OpenRouter, Gemini
 */

// Provider configurations
const PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    formatRequest: (model, messages, temperature, maxTokens) => ({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    formatRequest: (model, messages, temperature, maxTokens) => ({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'tngtech/deepseek-r1t2-chimera:free',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
      'X-Title': process.env.OPENROUTER_SITE_NAME || 'Job Application Automation'
    }),
    formatRequest: (model, messages, temperature, maxTokens) => ({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    model: 'gemini-2.5-flash',
    headers: (apiKey) => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (model, messages, temperature, maxTokens) => {
      // Convert OpenAI format to Gemini format
      // Gemini doesn't support system messages, so merge system message into first user message
      const processedMessages = [];
      let systemMessage = '';
      
      for (const msg of messages) {
        if (msg.role === 'system') {
          systemMessage = msg.content;
        } else if (msg.role === 'user') {
          const content = systemMessage ? `${systemMessage}\n\n${msg.content}` : msg.content;
          processedMessages.push({
            role: 'user',
            parts: [{ text: content }]
          });
          systemMessage = ''; // Clear after first use
        } else if (msg.role === 'assistant') {
          processedMessages.push({
            role: 'model',
            parts: [{ text: msg.content }]
          });
        }
      }
      
      return {
        contents: processedMessages,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      };
    },
    getUrl: (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  }
};

/**
 * Get the AI provider configuration based on environment variable
 */
function getProvider() {
  const providerName = process.env.AI_PROVIDER || 'openrouter';
  const provider = PROVIDERS[providerName.toLowerCase()];
  
  if (!provider) {
    throw new Error(`Invalid AI provider: ${providerName}. Supported providers: openai, groq, openrouter, gemini`);
  }
  
  return { name: providerName.toLowerCase(), config: provider };
}

/**
 * Get API key for the specified provider
 */
function getApiKey(providerName) {
  const keyMap = {
    openai: process.env.OPENAI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    gemini: process.env.GEMINI_API_KEY
  };
  
  const apiKey = keyMap[providerName];
  
  if (!apiKey) {
    throw new Error(`API key not found for provider: ${providerName}. Please set the appropriate environment variable.`);
  }
  
  return apiKey;
}

/**
 * Make a request to the AI provider
 */
async function makeAIRequest(messages, providerName = null) {
  try {
    const { name, config } = providerName ? 
      { name: providerName, config: PROVIDERS[providerName] } : 
      getProvider();
    
    const apiKey = getApiKey(name);
    
    // Handle Gemini separately using the official SDK
    if (name === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: config.model });
      
      // Convert messages to Gemini format
      let prompt = '';
      for (const msg of messages) {
        if (msg.role === 'system') {
          prompt += `${msg.content}\n\n`;
        } else if (msg.role === 'user') {
          prompt += msg.content;
        }
      }
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }
    
    // Handle other providers (OpenAI-compatible APIs)
    const url = config.getUrl ? config.getUrl(apiKey) : config.url;
    const requestBody = config.formatRequest(config.model, messages, 0.7, 2000);
    
    const response = await axios.post(
      url,
      requestBody,
      {
        headers: config.headers(apiKey),
        timeout: 60000 // 60 second timeout
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      const errorMessage = error.response.data.error?.message || 
                          error.response.data.message || 
                          error.response.statusText;
      throw new Error(`AI API Error: ${error.response.status} - ${errorMessage}`);
    } else if (error.request) {
      throw new Error('AI API Error: No response received from AI provider. Please check your internet connection.');
    } else {
      throw new Error(`AI API Error: ${error.message}`);
    }
  }
}

/**
 * Tailor a resume to match a specific job description
 * @param {string} originalResume - The user's original resume text
 * @param {string} jobDescription - The job description to tailor for
 * @returns {Promise<string>} - The tailored resume text
 */
async function tailorResume(originalResume, jobDescription) {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert resume writer specializing in ATS (Applicant Tracking System) optimization. Your goal is to tailor resumes to match job descriptions while maintaining authenticity and readability.'
      },
      {
        role: 'user',
        content: `Given this job description:

${jobDescription}

And this resume:

${originalResume}

Please tailor the resume to emphasize relevant skills and experience for this position. Follow these guidelines:
1. Maintain the original structure and format
2. Rewrite bullet points to match job requirements and use keywords from the job description naturally
3. Emphasize relevant experience and skills that align with the job
4. Keep it concise, professional, and ATS-friendly
5. Do not add false information - only reframe existing experience
6. Use action verbs and quantifiable achievements where possible
7. Return ONLY the tailored resume text without any additional commentary

Tailored Resume:`
      }
    ];
    
    const tailoredResume = await makeAIRequest(messages);
    
    // Clean up the response - remove any markdown formatting or extra whitespace
    return tailoredResume.trim();
  } catch (error) {
    // Provide a fallback message if AI service fails
    throw new Error(`Failed to tailor resume: ${error.message}`);
  }
}

/**
 * Extract key skills and requirements from a job description
 * @param {string} jobDescription - The job description to analyze
 * @returns {Promise<string[]>} - Array of extracted skills
 */
async function extractSkills(jobDescription) {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert at analyzing job descriptions and identifying key skills and requirements. Extract the most important technical and soft skills mentioned in job postings.'
      },
      {
        role: 'user',
        content: `Analyze this job description and extract the key skills and requirements:

${jobDescription}

Please identify:
1. Technical skills (programming languages, tools, frameworks, technologies)
2. Soft skills (communication, leadership, teamwork, etc.)
3. Required qualifications and certifications
4. Experience requirements

Return the skills as a JSON array of strings, with each skill as a separate item. Return ONLY the JSON array, no additional text.

Example format: ["JavaScript", "React", "Node.js", "Team Leadership", "Agile Methodology"]`
      }
    ];
    
    const response = await makeAIRequest(messages);
    
    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
      }
      
      const skills = JSON.parse(cleanResponse);
      
      // Validate that we got an array
      if (!Array.isArray(skills)) {
        throw new Error('Response is not an array');
      }
      
      return skills;
    } catch (parseError) {
      // If JSON parsing fails, try to extract skills from text
      const skillMatches = response.match(/"([^"]+)"/g);
      if (skillMatches) {
        return skillMatches.map(s => s.replace(/"/g, ''));
      }
      
      // Fallback: return empty array
      console.error('Failed to parse skills from AI response:', parseError);
      return [];
    }
  } catch (error) {
    throw new Error(`Failed to extract skills: ${error.message}`);
  }
}

export {
  makeAIRequest,
  getProvider,
  tailorResume,
  extractSkills
};
