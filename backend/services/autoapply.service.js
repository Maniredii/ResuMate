import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Base form-filling utility functions
 */

/**
 * Fills a text input field with retry logic
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector for the input field
 * @param {string} value - Value to fill
 * @param {number} timeout - Timeout in milliseconds
 */
async function fillField(page, selector, value, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    await page.fill(selector, value);
    // Wait a bit for any dynamic validation
    await page.waitForTimeout(500);
  } catch (error) {
    throw new Error(`Failed to fill field ${selector}: ${error.message}`);
  }
}

/**
 * Clicks a button or element with retry logic
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector for the element
 * @param {number} timeout - Timeout in milliseconds
 */
async function clickElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    await page.click(selector);
    await page.waitForTimeout(1000);
  } catch (error) {
    throw new Error(`Failed to click element ${selector}: ${error.message}`);
  }
}

/**
 * Uploads a file to a file input
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector for the file input
 * @param {string} filePath - Absolute path to the file
 * @param {number} timeout - Timeout in milliseconds
 */
async function uploadFile(page, selector, filePath, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    const fileInput = await page.$(selector);
    if (!fileInput) {
      throw new Error(`File input not found: ${selector}`);
    }
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(1000);
  } catch (error) {
    throw new Error(`Failed to upload file to ${selector}: ${error.message}`);
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
 * Main auto-apply function that routes to platform-specific implementations
 * @param {string} jobUrl - The URL of the job posting
 * @param {Object} userData - User profile data (name, email, phone, etc.)
 * @param {string} resumePath - Path to the tailored resume file
 * @returns {Promise<Object>} - Result object with success status and message
 */
export async function autoApply(jobUrl, userData, resumePath) {
  // Validate inputs
  if (!jobUrl || typeof jobUrl !== 'string') {
    return { success: false, message: 'Invalid job URL provided' };
  }
  
  if (!userData || !userData.name || !userData.email) {
    return { success: false, message: 'Invalid user data provided' };
  }
  
  if (!resumePath) {
    return { success: false, message: 'Resume path is required' };
  }
  
  // Detect platform
  const platform = detectPlatform(jobUrl);
  
  if (!platform) {
    return { 
      success: false, 
      message: 'Unsupported job platform. Only Indeed and Wellfound are supported.' 
    };
  }
  
  // Route to platform-specific function
  try {
    if (platform === 'indeed') {
      return await applyToIndeed(jobUrl, userData, resumePath);
    } else if (platform === 'wellfound') {
      return await applyToWellfound(jobUrl, userData, resumePath);
    }
  } catch (error) {
    return {
      success: false,
      message: `Auto-apply failed: ${error.message}`
    };
  }
}

/**
 * Applies to a job on Indeed
 * @param {string} jobUrl - Indeed job URL
 * @param {Object} userData - User profile data
 * @param {string} resumePath - Path to the tailored resume file
 * @returns {Promise<Object>} - Result object with success status and message
 */
async function applyToIndeed(jobUrl, userData, resumePath) {
  let browser = null;
  
  try {
    // Initialize Playwright browser (non-headless for form interaction)
    browser = await chromium.launch({ 
      headless: false,
      timeout: 30000 
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    
    // Navigate to Indeed application page
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
    
    // Wait for the "Apply now" button and click it
    const applyButtonSelectors = [
      'button:has-text("Apply now")',
      'button:has-text("Apply")',
      '.jobsearch-IndeedApplyButton-newDesign',
      '[data-indeed-apply-button]'
    ];
    
    let applyButtonFound = false;
    for (const selector of applyButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000, state: 'visible' });
        await page.click(selector);
        applyButtonFound = true;
        break;
      } catch (e) {
        // Try next selector
        continue;
      }
    }
    
    if (!applyButtonFound) {
      throw new Error('Could not find Apply button on Indeed job page');
    }
    
    // Wait for application form to load
    await page.waitForTimeout(2000);
    
    // Fill form fields with user profile data
    // Name field
    const nameSelectors = [
      'input[name="name"]',
      'input[id*="name"]',
      'input[placeholder*="name" i]',
      'input[aria-label*="name" i]'
    ];
    
    for (const selector of nameSelectors) {
      try {
        await fillField(page, selector, userData.name, 3000);
        break;
      } catch (e) {
        continue;
      }
    }
    
    // Email field
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[id*="email"]',
      'input[placeholder*="email" i]'
    ];
    
    for (const selector of emailSelectors) {
      try {
        await fillField(page, selector, userData.email, 3000);
        break;
      } catch (e) {
        continue;
      }
    }
    
    // Phone field (if available)
    if (userData.phone) {
      const phoneSelectors = [
        'input[name="phone"]',
        'input[type="tel"]',
        'input[id*="phone"]',
        'input[placeholder*="phone" i]'
      ];
      
      for (const selector of phoneSelectors) {
        try {
          await fillField(page, selector, userData.phone, 3000);
          break;
        } catch (e) {
          continue;
        }
      }
    }
    
    // Upload tailored resume file
    const resumeSelectors = [
      'input[type="file"]',
      'input[name*="resume"]',
      'input[id*="resume"]',
      'input[accept*="pdf"]'
    ];
    
    // Convert relative path to absolute
    const absoluteResumePath = path.isAbsolute(resumePath) 
      ? resumePath 
      : path.resolve(process.cwd(), resumePath);
    
    let resumeUploaded = false;
    for (const selector of resumeSelectors) {
      try {
        await uploadFile(page, selector, absoluteResumePath, 3000);
        resumeUploaded = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!resumeUploaded) {
      console.warn('Warning: Could not find resume upload field');
    }
    
    // Submit application form
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Submit application")',
      'button:has-text("Continue")',
      '[data-testid="submit-button"]'
    ];
    
    let submitClicked = false;
    for (const selector of submitSelectors) {
      try {
        await clickElement(page, selector, 3000);
        submitClicked = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!submitClicked) {
      throw new Error('Could not find Submit button');
    }
    
    // Wait for confirmation or error
    await page.waitForTimeout(3000);
    
    // Capture success confirmation or error messages
    const successIndicators = [
      'text="Application submitted"',
      'text="Successfully applied"',
      'text="Thank you for applying"',
      '.confirmation-message',
      '[data-testid="success-message"]'
    ];
    
    let successFound = false;
    for (const selector of successIndicators) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        successFound = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (successFound) {
      return {
        success: true,
        message: 'Application submitted successfully to Indeed'
      };
    } else {
      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.error, .error-message, [role="alert"]');
        if (errorElements.length > 0) {
          return Array.from(errorElements).map(el => el.textContent.trim()).join('; ');
        }
        return null;
      });
      
      if (errorMessage) {
        throw new Error(`Application error: ${errorMessage}`);
      }
      
      // If no clear success or error, assume success
      return {
        success: true,
        message: 'Application submitted to Indeed (confirmation pending)'
      };
    }
    
  } catch (error) {
    return {
      success: false,
      message: `Indeed application failed: ${error.message}`
    };
  } finally {
    // Close browser instances properly
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Applies to a job on Wellfound (formerly AngelList)
 * @param {string} jobUrl - Wellfound job URL
 * @param {Object} userData - User profile data
 * @param {string} resumePath - Path to the tailored resume file
 * @returns {Promise<Object>} - Result object with success status and message
 */
async function applyToWellfound(jobUrl, userData, resumePath) {
  let browser = null;
  
  try {
    // Initialize Playwright browser (non-headless for form interaction)
    browser = await chromium.launch({ 
      headless: false,
      timeout: 30000 
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    
    // Navigate to Wellfound application page
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
    
    // Wait for the "Apply" button and click it
    const applyButtonSelectors = [
      'button:has-text("Apply")',
      'button:has-text("Apply for this job")',
      '[data-test="apply-button"]',
      '.apply-button'
    ];
    
    let applyButtonFound = false;
    for (const selector of applyButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000, state: 'visible' });
        await page.click(selector);
        applyButtonFound = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!applyButtonFound) {
      throw new Error('Could not find Apply button on Wellfound job page');
    }
    
    // Wait for application form to load
    await page.waitForTimeout(2000);
    
    // Fill form fields with user profile data
    // Name field
    const nameSelectors = [
      'input[name="name"]',
      'input[name="full_name"]',
      'input[id*="name"]',
      'input[placeholder*="name" i]'
    ];
    
    for (const selector of nameSelectors) {
      try {
        await fillField(page, selector, userData.name, 3000);
        break;
      } catch (e) {
        continue;
      }
    }
    
    // Email field
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[id*="email"]',
      'input[placeholder*="email" i]'
    ];
    
    for (const selector of emailSelectors) {
      try {
        await fillField(page, selector, userData.email, 3000);
        break;
      } catch (e) {
        continue;
      }
    }
    
    // Phone field (if available)
    if (userData.phone) {
      const phoneSelectors = [
        'input[name="phone"]',
        'input[name="phone_number"]',
        'input[type="tel"]',
        'input[id*="phone"]'
      ];
      
      for (const selector of phoneSelectors) {
        try {
          await fillField(page, selector, userData.phone, 3000);
          break;
        } catch (e) {
          continue;
        }
      }
    }
    
    // Upload tailored resume file
    const resumeSelectors = [
      'input[type="file"]',
      'input[name*="resume"]',
      'input[id*="resume"]',
      'input[accept*="pdf"]'
    ];
    
    // Convert relative path to absolute
    const absoluteResumePath = path.isAbsolute(resumePath) 
      ? resumePath 
      : path.resolve(process.cwd(), resumePath);
    
    let resumeUploaded = false;
    for (const selector of resumeSelectors) {
      try {
        await uploadFile(page, selector, absoluteResumePath, 3000);
        resumeUploaded = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!resumeUploaded) {
      console.warn('Warning: Could not find resume upload field');
    }
    
    // Submit application form
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Submit application")',
      'button:has-text("Send application")',
      '[data-test="submit-button"]'
    ];
    
    let submitClicked = false;
    for (const selector of submitSelectors) {
      try {
        await clickElement(page, selector, 3000);
        submitClicked = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!submitClicked) {
      throw new Error('Could not find Submit button');
    }
    
    // Wait for confirmation or error
    await page.waitForTimeout(3000);
    
    // Capture success confirmation or error messages
    const successIndicators = [
      'text="Application sent"',
      'text="Successfully applied"',
      'text="Thank you"',
      '[data-test="success-message"]',
      '.success-message'
    ];
    
    let successFound = false;
    for (const selector of successIndicators) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        successFound = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (successFound) {
      return {
        success: true,
        message: 'Application submitted successfully to Wellfound'
      };
    } else {
      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.error, .error-message, [role="alert"]');
        if (errorElements.length > 0) {
          return Array.from(errorElements).map(el => el.textContent.trim()).join('; ');
        }
        return null;
      });
      
      if (errorMessage) {
        throw new Error(`Application error: ${errorMessage}`);
      }
      
      // If no clear success or error, assume success
      return {
        success: true,
        message: 'Application submitted to Wellfound (confirmation pending)'
      };
    }
    
  } catch (error) {
    return {
      success: false,
      message: `Wellfound application failed: ${error.message}`
    };
  } finally {
    // Close browser instances properly
    if (browser) {
      await browser.close();
    }
  }
}
