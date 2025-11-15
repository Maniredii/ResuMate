# Input Validation and Sanitization

This document describes the input validation and sanitization implementation for the Job Application Automation System.

## Overview

The application implements comprehensive input validation and sanitization to protect against:
- SQL injection attacks
- Path traversal attacks
- Cross-site scripting (XSS)
- Invalid data formats
- Malicious file uploads

## Validation Middleware

All validation and sanitization functions are located in `backend/middleware/validation.js`.

### Email Validation

**Function:** `isValidEmail(email)`

Validates email addresses using RFC 5322 compliant regex.

**Features:**
- Checks for valid email format
- Enforces maximum length of 254 characters
- Returns boolean (true/false)

**Usage:**
```javascript
import { isValidEmail } from './middleware/validation.js';

if (isValidEmail('user@example.com')) {
  // Valid email
}
```

**Middleware:** `validateEmail`

Automatically validates and sanitizes email in request body:
- Trims whitespace
- Converts to lowercase
- Returns 400 error if invalid

### Job URL Validation

**Function:** `validateJobUrl(url)`

Validates job posting URLs and checks for supported platforms.

**Features:**
- Validates URL format
- Checks for HTTP/HTTPS protocol
- Verifies supported platforms (Indeed, Wellfound)
- Returns object with validation result and platform

**Returns:**
```javascript
{
  valid: boolean,
  platform: 'indeed' | 'wellfound' | null,
  error: string | null
}
```

**Middleware:** `validateJobUrlMiddleware`

Automatically validates job URLs in request body:
- Validates URL format and platform
- Trims whitespace
- Adds `jobPlatform` to request body
- Returns 400 error if invalid

### Filename Sanitization

**Function:** `sanitizeFilename(filename)`

Sanitizes filenames to prevent path traversal and injection attacks.

**Features:**
- Removes path separators (`/`, `\`)
- Removes parent directory references (`..`)
- Removes invalid Windows filename characters
- Removes leading dots
- Limits filename length to 200 characters
- Preserves file extension

**Examples:**
```javascript
sanitizeFilename('../../../etc/passwd')  // Returns: '______etc_passwd'
sanitizeFilename('C:\\Users\\test.pdf')  // Returns: 'C__Users_test.pdf'
sanitizeFilename('resume<>:"|?*.pdf')    // Returns: 'resume_______.pdf'
```

**Integration:**
Automatically applied in Multer configuration for all file uploads:
- Resume uploads
- Document uploads
- Tailored resume generation

### String Sanitization

**Function:** `sanitizeString(input)`

Sanitizes string inputs to prevent injection attacks.

**Features:**
- Removes null bytes
- Removes control characters
- Trims whitespace

**Middleware:** `sanitizeRequestBody`

Automatically sanitizes all string values in request body.

### Required Fields Validation

**Middleware:** `validateRequiredFields(fields)`

Validates that required fields are present in request body.

**Usage:**
```javascript
router.post('/endpoint', 
  validateRequiredFields(['name', 'email']),
  (req, res) => {
    // Fields are guaranteed to exist
  }
);
```

## Applied Validations by Endpoint

### Authentication Routes (`/api/auth`)

#### POST /register
- ✅ Sanitizes all request body strings
- ✅ Validates required fields: name, email, password
- ✅ Validates email format
- ✅ Sanitizes and normalizes email (trim, lowercase)

#### POST /login
- ✅ Sanitizes all request body strings
- ✅ Validates required fields: email, password
- ✅ Validates email format
- ✅ Sanitizes and normalizes email (trim, lowercase)

### Job Routes (`/api/job`)

#### POST /apply-job
- ✅ Requires authentication
- ✅ Sanitizes all request body strings
- ✅ Validates job URL format
- ✅ Validates supported platform (Indeed, Wellfound)
- ✅ Sanitizes URL (trim)
- ✅ Adds platform information to request

### User Routes (`/api/user`)

#### PUT /update-profile
- ✅ Requires authentication
- ✅ Sanitizes all request body strings
- ✅ Validates required field: name

### Upload Routes (`/api/upload`)

#### POST /upload-resume
- ✅ Requires authentication
- ✅ Validates file type (PDF, DOCX only)
- ✅ Sanitizes filename (prevents path traversal)
- ✅ Limits file size to 10MB

#### POST /upload-document
- ✅ Requires authentication
- ✅ Validates file type (PDF, DOCX only)
- ✅ Sanitizes filename (prevents path traversal)
- ✅ Limits file size to 10MB

## Security Best Practices

### SQL Injection Prevention
- All database queries use parameterized statements (prepared statements)
- User input is never directly concatenated into SQL queries
- Example:
  ```javascript
  db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  ```

### Path Traversal Prevention
- All filenames are sanitized before storage
- File paths are resolved to absolute paths
- Files are stored in designated upload directories only
- Example:
  ```javascript
  const resumePath = path.resolve(process.cwd(), user.resume_path);
  ```

### XSS Prevention
- All string inputs are sanitized
- React's built-in XSS protection on frontend
- No user input is rendered as HTML

### File Upload Security
- Whitelist approach for file types (PDF, DOCX only)
- File size limits enforced (10MB max)
- Filenames sanitized to prevent injection
- Files stored outside web root

## Testing

Run validation tests:
```bash
node backend/test-validation.js
```

This will test:
- Email validation with various formats
- Job URL validation for different platforms
- Filename sanitization with malicious inputs
- String sanitization with control characters

## Requirements Coverage

This implementation satisfies the following requirements:

- **Requirement 1.1**: Email format validation on backend ✅
- **Requirement 2.5**: File name sanitization to prevent path traversal ✅
- **Requirement 3.1**: Job URL validation before scraping ✅

## Future Enhancements

Potential improvements:
- Rate limiting per user/IP
- CAPTCHA for registration
- Password strength requirements
- Input length limits for all fields
- Content Security Policy (CSP) headers
- Request body size limits
