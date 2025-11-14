# Auto-Apply Service Usage Guide

## Overview

The auto-apply service (`backend/services/autoapply.service.js`) automates job application submissions to Indeed and Wellfound using Playwright browser automation.

## Features

- **Platform Support**: Indeed and Wellfound job platforms
- **Browser Automation**: Non-headless browser for form interaction
- **Form Filling**: Automatically fills name, email, phone fields
- **Resume Upload**: Uploads tailored resume files
- **Error Handling**: Comprehensive error handling with descriptive messages
- **Success Detection**: Captures confirmation messages or errors

## API

### Main Function: `autoApply(jobUrl, userData, resumePath)`

**Parameters:**
- `jobUrl` (string): The URL of the job posting
- `userData` (object): User profile data
  - `name` (string, required): User's full name
  - `email` (string, required): User's email address
  - `phone` (string, optional): User's phone number
- `resumePath` (string): Path to the tailored resume file (relative or absolute)

**Returns:**
```javascript
{
  success: boolean,
  message: string
}
```

## Usage Example

```javascript
import { autoApply } from './services/autoapply.service.js';

const userData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '555-123-4567'
};

const resumePath = './uploads/tailored/resume_123.pdf';
const jobUrl = 'https://www.indeed.com/viewjob?jk=abc123';

const result = await autoApply(jobUrl, userData, resumePath);

if (result.success) {
  console.log('Application submitted successfully!');
} else {
  console.error('Application failed:', result.message);
}
```

## Platform-Specific Functions

### `applyToIndeed(jobUrl, userData, resumePath)`

Handles job applications on Indeed.com. Automatically:
1. Navigates to the job page
2. Clicks the "Apply now" button
3. Fills in the application form
4. Uploads the resume
5. Submits the application
6. Captures success/error messages

### `applyToWellfound(jobUrl, userData, resumePath)`

Handles job applications on Wellfound (formerly AngelList). Automatically:
1. Navigates to the job page
2. Clicks the "Apply" button
3. Fills in the application form
4. Uploads the resume
5. Submits the application
6. Captures success/error messages

## Error Handling

The service includes comprehensive error handling for:
- Invalid URLs
- Unsupported platforms
- Missing user data
- Missing resume files
- Form submission failures
- Network errors
- Timeout errors

All errors return a structured response:
```javascript
{
  success: false,
  message: 'Descriptive error message'
}
```

## Testing

Run the test script to verify basic functionality:

```bash
node backend/test-autoapply.js
```

This tests:
- Input validation
- Platform detection
- Error handling

**Note:** To test actual job applications, you need:
1. A real job posting URL
2. A valid resume file
3. The browser will open in non-headless mode for you to observe

## Browser Behavior

- **Non-Headless Mode**: The browser opens visibly so you can see the automation
- **Timeout**: 30 seconds for page loads and element waits
- **User Agent**: Modern Chrome user agent to avoid detection
- **Auto-Close**: Browser closes automatically after completion

## Limitations

- LinkedIn is not supported (as per requirements)
- Some job platforms may require manual login
- CAPTCHA challenges cannot be automated
- Application forms vary by employer - some may not be fully automated

## Future Enhancements

- Add support for more job platforms
- Implement CAPTCHA detection and notification
- Add screenshot capture for debugging
- Support for cover letter uploads
- Handle multi-step application forms
