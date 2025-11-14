import { chromium } from 'playwright';

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
      throw new Error('Unsupported job platform. Only Indeed and Wellfound are supported.');
    }

    // Initialize Playwright browser in headless mode
    browser = await chromium.launch({ 
      headless: true,
      timeout: 30000 
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
  }
  
  return null;
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
    throw new Error(`Wellfound scraping failed: ${error.message}`);
  }
}
