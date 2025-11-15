/**
 * Test script for validation and sanitization functions
 */

import { 
  isValidEmail, 
  validateJobUrl, 
  sanitizeFilename, 
  sanitizeString 
} from './middleware/validation.js';

console.log('=== Testing Email Validation ===');
console.log('Valid email (test@example.com):', isValidEmail('test@example.com'));
console.log('Valid email (user.name+tag@example.co.uk):', isValidEmail('user.name+tag@example.co.uk'));
console.log('Invalid email (notanemail):', isValidEmail('notanemail'));
console.log('Invalid email (@example.com):', isValidEmail('@example.com'));
console.log('Invalid email (test@):', isValidEmail('test@'));
console.log('Invalid email (null):', isValidEmail(null));
console.log('Invalid email (empty string):', isValidEmail(''));

console.log('\n=== Testing Job URL Validation ===');
console.log('Valid Indeed URL:', validateJobUrl('https://www.indeed.com/viewjob?jk=123456'));
console.log('Valid Wellfound URL:', validateJobUrl('https://wellfound.com/jobs/123456'));
console.log('Valid Angel.co URL:', validateJobUrl('https://angel.co/company/test/jobs/123456'));
console.log('Invalid URL (LinkedIn):', validateJobUrl('https://www.linkedin.com/jobs/view/123456'));
console.log('Invalid URL (not a URL):', validateJobUrl('not a url'));
console.log('Invalid URL (ftp protocol):', validateJobUrl('ftp://indeed.com/job'));
console.log('Invalid URL (null):', validateJobUrl(null));
console.log('Invalid URL (empty string):', validateJobUrl(''));

console.log('\n=== Testing Filename Sanitization ===');
console.log('Normal filename:', sanitizeFilename('resume.pdf'));
console.log('Path traversal attempt:', sanitizeFilename('../../../etc/passwd'));
console.log('Windows path:', sanitizeFilename('C:\\Users\\test\\resume.pdf'));
console.log('Unix path:', sanitizeFilename('/home/user/resume.pdf'));
console.log('Special characters:', sanitizeFilename('resume<>:"|?*.pdf'));
console.log('Leading dots:', sanitizeFilename('...resume.pdf'));
console.log('Null bytes:', sanitizeFilename('resume\0.pdf'));
console.log('Empty string:', sanitizeFilename(''));
console.log('Very long filename:', sanitizeFilename('a'.repeat(300) + '.pdf'));

console.log('\n=== Testing String Sanitization ===');
console.log('Normal string:', sanitizeString('Hello World'));
console.log('String with null bytes:', sanitizeString('Hello\0World'));
console.log('String with control chars:', sanitizeString('Hello\x00\x01\x02World'));
console.log('String with whitespace:', sanitizeString('  Hello World  '));
console.log('Empty string:', sanitizeString(''));
console.log('Null input:', sanitizeString(null));

console.log('\n=== All validation tests completed ===');
