import { chromium } from 'playwright';
import { logAutomationError } from '../utils/logger.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Scrapes job description from a given job URL
 * Supports Indeed and Wellfound job platforms
 * @param {string} jobUrl - The URL of the job posting
 * @returns {Promise<Object>} - Job data including title, company, and description
 */
export async function scrapeJobDescription(jobUrl) {
  let browser = null;
  
  try {
    // Validate URL
    if (!jobUrl || typeof jobUrl !== 'string') {
      throw new Error('Invalid job URL provided');
    }

    // Detect platform
    const platform = detectPlatform(jobUrl);
    if (!platform) {
      throw new Error('Unsupported job platform. Only Indeed, Wellfound, and LinkedIn are supported.');
    }

    // LinkedIn uses different flow (generates PDF report)
    if (platform === 'linkedin') {
      // Close browser if opened
      if (browser) await browser.close();
      // Return note that LinkedIn requires special handling
      return {
        title: 'LinkedIn Job',
        company: 'LinkedIn',
        description: 'LinkedIn jobs require special handling. Use the LinkedIn scraping endpoint.',
        platform: 'LinkedIn',
        url: jobUrl,
        requiresLinkedInEndpoint: true
      };
    }

    // Initialize Playwright browser in non-headless mode (visible browser)
    // This will open in a new tab of the default browser
    browser = await chromium.launch({ 
      headless: false,
      timeout: 30000,
      channel: 'chrome' // Use system Chrome/Edge browser
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Set 30-second timeout for page loads
    page.setDefaultTimeout(30000);
    
    // Scrape based on platform
    let jobData;
    if (platform === 'indeed') {
      jobData = await scrapeIndeed(page, jobUrl);
    } else if (platform === 'wellfound') {
      jobData = await scrapeWellfound(page, jobUrl);
    }
    
    return jobData;
    
  } catch (error) {
    // Log automation error with context
    logAutomationError(error, {
      platform: detectPlatform(jobUrl) || 'unknown',
      jobUrl: jobUrl,
      step: 'scrapeJobDescription',
      errorType: error.message.includes('Timeout') ? 'TIMEOUT' : 
                 error.message.includes('net::') ? 'NETWORK_ERROR' : 'SCRAPING_ERROR'
    });

    // Return descriptive error messages
    if (error.message.includes('Timeout')) {
      throw new Error(`Failed to load job page within 30 seconds: ${error.message}`);
    } else if (error.message.includes('net::')) {
      throw new Error(`Network error while accessing job page: ${error.message}`);
    } else {
      throw new Error(`Failed to scrape job description: ${error.message}`);
    }
  } finally {
    // Close browser instances properly
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Detects the job platform from URL
 * @param {string} url - Job URL
 * @returns {string|null} - Platform name or null
 */
function detectPlatform(url) {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('indeed.com')) {
    return 'indeed';
  } else if (urlLower.includes('wellfound.com') || urlLower.includes('angel.co')) {
    return 'wellfound';
  } else if (urlLower.includes('linkedin.com')) {
    return 'linkedin';
  }
  
  return null;
}

/**
 * Scrapes LinkedIn job and generates PDF report
 * @param {string} jobUrl - LinkedIn job URL
 * @param {string} userResume - User's resume text for skill comparison
 * @returns {Promise<Object>} - Job data and PDF path
 */
export async function scrapeLinkedInJob(jobUrl, userResume = '') {
  let browser = null;
  
  try {
    browser = await chromium.launch({ 
      headless: false,
      timeout: 30000,
      channel: 'chrome' // Use system Chrome/Edge browser
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    
    // Navigate to LinkedIn job page
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
    
    // Wait for job content to load
    await page.waitForSelector('.jobs-description, .description__text, .show-more-less-html__markup', { 
      timeout: 30000 
    });
    
    // Extract job details
    const jobData = await page.evaluate(() => {
      // Job title
      const titleElement = document.querySelector('.job-details-jobs-unified-top-card__job-title, h1.t-24, .jobs-unified-top-card__job-title');
      const title = titleElement ? titleElement.textContent.trim() : 'N/A';
      
      // Company name
      const companyElement = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, a.ember-view.t-black');
      const company = companyElement ? companyElement.textContent.trim() : 'N/A';
      
      // Job description
      const descElement = document.querySelector('.jobs-description, .description__text, .show-more-less-html__markup');
      const description = descElement ? descElement.textContent.trim() : '';
      
      // Location
      const locationElement = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet');
      const location = locationElement ? locationElement.textContent.trim() : 'N/A';
      
      return { title, company, description, location };
    });
    
    if (!jobData.description) {
      throw new Error('Could not extract job description from LinkedIn page');
    }
    
    // Extract skills from job description using AI
    const { extractSkills } = await import('./ai.service.js');
    const requiredSkills = await extractSkills(jobData.description);
    
    // Extract skills from user resume
    let userSkills = [];
    if (userResume) {
      userSkills = await extractSkills(userResume);
    }
    
    // Find missing skills
    const missingSkills = requiredSkills.filter(skill => 
      !userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
    
    // Generate PDF report
    const pdfPath = await generateJobReportPDF({
      ...jobData,
      url: jobUrl,
      requiredSkills,
      missingSkills,
      platform: 'LinkedIn'
    });
    
    return {
      ...jobData,
      platform: 'LinkedIn',
      url: jobUrl,
      requiredSkills,
      missingSkills,
      pdfPath
    };
    
  } catch (error) {
    logAutomationError(error, {
      platform: 'linkedin',
      jobUrl: jobUrl,
      step: 'scrapeLinkedInJob',
      errorType: 'LINKEDIN_SCRAPING_ERROR'
    });
    
    throw new Error(`LinkedIn scraping failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generates a PDF report for a job posting
 * @param {Object} jobData - Job data including title, company, description, skills
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateJobReportPDF(jobData) {
  return new Promise((resolve, reject) => {
    try {
      // Create reports directory if it doesn't exist
      const reportsDir = path.join(__dirname, '../uploads/reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `job_report_${timestamp}.pdf`;
      const filepath = path.join(reportsDir, filename);
      
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);
      
      doc.pipe(stream);
      
      // Title
      doc.fontSize(20).font('Helvetica-Bold').text('Job Analysis Report', { align: 'center' });
      doc.moveDown();
      
      // Company
      doc.fontSize(16).font('Helvetica-Bold').text('Company', { underline: true });
      doc.fontSize(12).font('Helvetica').text(jobData.company || 'N/A');
      doc.moveDown();
      
      // Job Role
      doc.fontSize(16).font('Helvetica-Bold').text('Job Role', { underline: true });
      doc.fontSize(12).font('Helvetica').text(jobData.title || 'N/A');
      doc.moveDown();
      
      // Job Description
      doc.fontSize(16).font('Helvetica-Bold').text('Job Description', { underline: true });
      doc.fontSize(10).font('Helvetica').text(jobData.description || 'N/A', {
        align: 'justify',
        width: 500
      });
      doc.moveDown();
      
      // Required Skills
      doc.fontSize(16).font('Helvetica-Bold').text('Required Skills', { underline: true });
      if (jobData.requiredSkills && jobData.requiredSkills.length > 0) {
        jobData.requiredSkills.forEach((skill, index) => {
          doc.fontSize(11).font('Helvetica').text(`${index + 1}. ${skill}`);
        });
      } else {
        doc.fontSize(11).font('Helvetica').text('No specific skills extracted');
      }
      doc.moveDown();
      
      // Missing Skills
      doc.fontSize(16).font('Helvetica-Bold').fillColor('red').text('Skills Missing', { underline: true });
      doc.fillColor('black');
      if (jobData.missingSkills && jobData.missingSkills.length > 0) {
        jobData.missingSkills.forEach((skill, index) => {
          doc.fontSize(11).font('Helvetica').fillColor('red').text(`${index + 1}. ${skill}`);
        });
        doc.fillColor('black');
      } else {
        doc.fontSize(11).font('Helvetica').text('You have all required skills!');
      }
      doc.moveDown();
      
      // Job URL
      doc.fontSize(10).font('Helvetica').fillColor('blue').text(`Job URL: ${jobData.url}`, {
        link: jobData.url,
        underline: true
      });
      
      // Finalize PDF
      doc.end();
      
      stream.on('finish', () => {
        resolve(filepath);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Scrapes job data from Indeed
 * @param {Page} page - Playwright page object
 * @param {string} jobUrl - Indeed job URL
 * @returns {Promise<Object>} - Structured job data
 */
async function scrapeIndeed(page, jobUrl) {
  try {
    // Navigate to job page and wait for content
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
    
    // Wait for job description to load
    await page.waitForSelector('.jobsearch-jobDescriptionText, #jobDescriptionText', { 
      timeout: 30000 
    });
    
    // Extract job title
    const title = await page.evaluate(() => {
      const titleElement = document.querySelector('h1.jobsearch-JobInfoHeader-title, h2.jobsearch-JobInfoHeader-title, .jobsearch-JobInfoHeader-title');
      return titleElement ? titleElement.textContent.trim() : 'N/A';
    });
    
    // Extract company name
    const company = await page.evaluate(() => {
      const companyElement = document.querySelector('[data-company-name="true"], .jobsearch-InlineCompanyRating-companyHeader a, .jobsearch-CompanyInfoContainer a');
      return companyElement ? companyElement.textContent.trim() : 'N/A';
    });
    
    // Extract job description
    const description = await page.evaluate(() => {
      const descElement = document.querySelector('.jobsearch-jobDescriptionText, #jobDescriptionText');
      return descElement ? descElement.textContent.trim() : '';
    });
    
    if (!description) {
      throw new Error('Could not extract job description from Indeed page');
    }
    
    // Return structured job data
    return {
      title,
      company,
      description,
      platform: 'Indeed',
      url: jobUrl
    };
    
  } catch (error) {
    // Log Indeed-specific scraping error
    logAutomationError(error, {
      platform: 'indeed',
      jobUrl: jobUrl,
      step: 'scrapeIndeed',
      errorType: 'INDEED_SCRAPING_ERROR'
    });
    
    throw new Error(`Indeed scraping failed: ${error.message}`);
  }
}

/**
 * Scrapes job data from Wellfound (formerly AngelList)
 * @param {Page} page - Playwright page object
 * @param {string} jobUrl - Wellfound job URL
 * @returns {Promise<Object>} - Structured job data
 */
async function scrapeWellfound(page, jobUrl) {
  try {
    // Navigate to job page and wait for content
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
    
    // Wait for job description to load
    await page.waitForSelector('[data-test="JobDescription"], .job-description, .styles_description__', { 
      timeout: 30000 
    });
    
    // Extract job title
    const title = await page.evaluate(() => {
      const titleElement = document.querySelector('[data-test="JobTitle"], h1, .styles_title__');
      return titleElement ? titleElement.textContent.trim() : 'N/A';
    });
    
    // Extract company name
    const company = await page.evaluate(() => {
      const companyElement = document.querySelector('[data-test="StartupLink"], .company-name, .styles_company__');
      return companyElement ? companyElement.textContent.trim() : 'N/A';
    });
    
    // Extract job description
    const description = await page.evaluate(() => {
      const descElement = document.querySelector('[data-test="JobDescription"], .job-description, .styles_description__');
      return descElement ? descElement.textContent.trim() : '';
    });
    
    if (!description) {
      throw new Error('Could not extract job description from Wellfound page');
    }
    
    // Return structured job data
    return {
      title,
      company,
      description,
      platform: 'Wellfound',
      url: jobUrl
    };
    
  } catch (error) {
    // Log Wellfound-specific scraping error
    logAutomationError(error, {
      platform: 'wellfound',
      jobUrl: jobUrl,
      step: 'scrapeWellfound',
      errorType: 'WELLFOUND_SCRAPING_ERROR'
    });
    
    throw new Error(`Wellfound scraping failed: ${error.message}`);
  }
}
