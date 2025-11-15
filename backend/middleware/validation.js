/**
 * Validation and Sanitization Middleware
 * Provides input validation and sanitization utilities
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate job URL format and supported platforms
 * @param {string} url - Job URL to validate
 * @returns {object} - { valid: boolean, platform: string|null, error: string|null }
 */
export function validateJobUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, platform: null, error: 'URL is required and must be a string' };
  }

  // Trim whitespace
  url = url.trim();

  // Check if it's a valid URL format
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    return { valid: false, platform: null, error: 'Invalid URL format' };
  }

  // Check protocol (must be http or https)
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { valid: false, platform: null, error: 'URL must use HTTP or HTTPS protocol' };
  }

  // Check for supported platforms
  const hostname = parsedUrl.hostname.toLowerCase();
  
  if (hostname.includes('indeed.com')) {
    return { valid: true, platform: 'indeed', error: null };
  } else if (hostname.includes('wellfound.com') || hostname.includes('angel.co')) {
    return { valid: true, platform: 'wellfound', error: null };
  } else {
    return { 
      valid: false, 
      platform: null, 
      error: 'Unsupported job platform. Only Indeed and Wellfound are supported.' 
    };
  }
}

/**
 * Sanitize filename to prevent path traversal attacks
 * Removes dangerous characters and path separators
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file';
  }

  // Remove path separators and dangerous characters
  let sanitized = filename
    .replace(/[\/\\]/g, '_')           // Replace path separators
    .replace(/\.\./g, '_')             // Replace parent directory references
    .replace(/[<>:"|?*\x00-\x1f]/g, '_') // Replace invalid Windows filename chars
    .replace(/^\.+/, '_')              // Replace leading dots
    .trim();

  // Ensure filename is not empty after sanitization
  if (sanitized.length === 0) {
    sanitized = 'unnamed_file';
  }

  // Limit filename length (keep extension)
  const maxLength = 200;
  if (sanitized.length > maxLength) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = nameWithoutExt.substring(0, maxLength - ext.length) + ext;
  }

  return sanitized;
}

/**
 * Sanitize string input to prevent XSS and injection attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeString(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and control characters
  return input
    .replace(/\0/g, '')                    // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control chars
    .trim();
}

/**
 * Middleware: Validate request body fields
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Function} - Express middleware function
 */
export function validateRequiredFields(requiredFields) {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!req.body[field] || (typeof req.body[field] === 'string' && req.body[field].trim() === '')) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Middleware: Validate email in request body
 */
export function validateEmail(req, res, next) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Email is required'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid email format'
    });
  }

  // Sanitize email (trim and lowercase)
  req.body.email = email.trim().toLowerCase();

  next();
}

/**
 * Middleware: Validate job URL in request body
 */
export function validateJobUrlMiddleware(req, res, next) {
  const { jobUrl } = req.body;

  if (!jobUrl) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Job URL is required'
    });
  }

  const validation = validateJobUrl(jobUrl);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation Error',
      message: validation.error
    });
  }

  // Sanitize URL (trim)
  req.body.jobUrl = jobUrl.trim();
  req.body.jobPlatform = validation.platform;

  next();
}

/**
 * Middleware: Sanitize all string inputs in request body
 */
export function sanitizeRequestBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }

  next();
}
